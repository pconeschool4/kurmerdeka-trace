"""
AI Generate Soal service — Groq API dengan cache fallback.

Alur:
1. Cek cache: tabel soal WHERE sumber='ai' AND subbab=<subbab> LIMIT jumlah
2. Kalau cache cukup → return dari cache
3. Kalau tidak ada/kurang → panggil Groq API
4. Parse JSON response → insert ke soal (sumber='ai') → return
5. Kalau Groq error (rate limit / timeout) → fallback ke soal manual (sumber='manual')
"""
import json
import re
import logging
from typing import List

from groq import Groq, RateLimitError, APIStatusError
from supabase import Client

from app.database import get_settings
from app.models import SoalItem

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE = """Generate {jumlah} soal pilihan ganda tentang {subbab} 
dari materi {bab} untuk siswa {tingkat_pendidikan}.
Tingkat kesulitan: {level}

PENTING: Sesuaikan gaya bahasa dengan usia {tingkat_pendidikan}. Jika siswa SD/SMP, gunakan bahasa santai dan analogi benda sehari-hari (seperti kelereng, permen, buku, dll). Jika SMA, gunakan bahasa lebih formal.

PENTING: Balas HANYA dengan JSON array valid. Tidak ada teks lain di luar array.

Format JSON:
[{{
  "soal": "...",
  "pilihan": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "jawaban": "A",
  "penjelasan": "... (Berikan penjelasan langkah demi langkah, LALU berikan sebuah ANALOGI DUNIA NYATA yang sangat mudah dipahami siswa SMP untuk konsep ini)"
}}]

Contoh untuk matriks identitas:
"Jika I adalah matriks identitas ordo 2x2, maka I = ..."
"""


def _parse_groq_response(text: str) -> List[dict]:
    """Ekstrak JSON array dari teks respons Groq (toleran terhadap markdown code block)."""
    # Coba ekstrak dari markdown code block dulu
    match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", text, re.DOTALL)
    if match:
        text = match.group(1)
    else:
        # Cari JSON array langsung
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            text = match.group(0)

    return json.loads(text)


def generate_soal(
    db: Client,
    subbab: str,
    level: str,
    jumlah: int,
    tingkat_pendidikan: str = "SMP Kelas 8",
) -> List[SoalItem]:
    """
    Main function: cek cache → Groq → fallback manual.
    Return list SoalItem.
    """
    # ── 1. Cek cache AI ──────────────────────────────────────────────────────
    cached = (
        db.table("soal")
        .select("*")
        .eq("sumber", "ai")
        .eq("subbab", subbab)
        .limit(jumlah)
        .execute()
        .data
    )
    if len(cached) >= jumlah:
        logger.info(f"Cache hit untuk subbab={subbab}, return {jumlah} soal dari cache")
        return [_row_to_soal(r) for r in cached[:jumlah]]

    # ── 2. Panggil Groq API ───────────────────────────────────────────────────
    settings = get_settings()
    try:
        client = Groq(api_key=settings.groq_api_key)
        prompt = PROMPT_TEMPLATE.format(
            jumlah=jumlah,
            subbab=subbab.replace("_", " "),
            bab="Matriks",
            tingkat_pendidikan=tingkat_pendidikan,
            level=level,
        )
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048,
        )
        raw_text = response.choices[0].message.content
        soal_list_raw = _parse_groq_response(raw_text)

        # ── 3. Simpan ke DB dan return ────────────────────────────────────────
        inserted: List[SoalItem] = []
        for raw in soal_list_raw[:jumlah]:
            row = {
                "bab": "Matriks",
                "cp": _subbab_to_cp(subbab),
                "subbab": subbab,
                "soal": raw["soal"],
                "pilihan": raw["pilihan"],
                "jawaban": raw["jawaban"],
                "penjelasan": raw.get("penjelasan", ""),
                "sumber": "ai",
            }
            result = db.table("soal").insert(row).execute()
            saved = result.data[0] if result.data else row
            inserted.append(_row_to_soal(saved))

        logger.info(f"Groq generate {len(inserted)} soal untuk subbab={subbab}")
        return inserted

    except (RateLimitError, APIStatusError, json.JSONDecodeError, Exception) as exc:
        logger.warning(f"Groq error ({type(exc).__name__}): {exc}. Fallback ke soal manual.")

    # ── 4. Fallback: soal manual dari subbab yang sama ────────────────────────
    manual = (
        db.table("soal")
        .select("*")
        .eq("sumber", "manual")
        .eq("subbab", subbab)
        .limit(jumlah)
        .execute()
        .data
    )
    if manual:
        return [_row_to_soal(r) for r in manual[:jumlah]]

    # Fallback terakhir: semua soal manual bab Matriks
    all_manual = (
        db.table("soal")
        .select("*")
        .eq("sumber", "manual")
        .limit(jumlah)
        .execute()
        .data
    )
    return [_row_to_soal(r) for r in all_manual[:jumlah]]


def _row_to_soal(row: dict) -> SoalItem:
    return SoalItem(
        id=row.get("id"),
        bab=row.get("bab", "Matriks"),
        cp=row.get("cp", ""),
        subbab=row.get("subbab", ""),
        soal=row.get("soal", ""),
        pilihan=row.get("pilihan", []),
        jawaban=row.get("jawaban", ""),
        penjelasan=row.get("penjelasan", ""),
        sumber=row.get("sumber", "manual"),
    )


def _subbab_to_cp(subbab: str) -> str:
    """Mapping subbab → CP berdasarkan seed data."""
    mapping = {
        "ordo_matriks": "CP 3.1",
        "elemen_matriks": "CP 3.1",
        "pengertian_matriks": "CP 3.1",
        "penjumlahan_matriks": "CP 3.2",
        "pengurangan_matriks": "CP 3.2",
        "perkalian_skalar": "CP 3.2",
        "matriks_identitas": "CP 3.3",
        "perkalian_matriks": "CP 3.3",
    }
    return mapping.get(subbab, "CP 3.1")
