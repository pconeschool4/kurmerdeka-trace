"""
Scoring service — hitung benar/salah, update skor_cp, update weak_spot.
Semua query langsung pakai Supabase client (tidak ada ORM).
"""
from datetime import datetime, timezone
from typing import List, Dict
from supabase import Client

from app.models import JawabanItem, SkorCP, WeakSpot


def _status_from_persen(persen: float) -> str:
    """Konversi persentase ke warna status."""
    if persen >= 80:
        return "hijau"
    elif persen >= 50:
        return "kuning"
    return "merah"


def proses_jawaban(
    db: Client,
    siswa_id: int,
    jawaban_list: List[JawabanItem],
) -> tuple[List[SkorCP], List[WeakSpot]]:
    """
    1. Ambil soal dari DB berdasarkan soal_id.
    2. Periksa benar/salah.
    3. Insert ke jawaban_siswa.
    4. Upsert skor_cp.
    5. Upsert weak_spot.
    6. Return (skor_per_cp, weak_spots).
    """
    if not jawaban_list:
        return [], []

    soal_ids = [j.soal_id for j in jawaban_list]

    # Ambil soal sekaligus
    soal_rows = (
        db.table("soal")
        .select("id, cp, subbab, jawaban")
        .in_("id", soal_ids)
        .execute()
        .data
    )
    soal_map: Dict[int, dict] = {s["id"]: s for s in soal_rows}

    # Kelompokkan jawaban per CP dan per subbab
    cp_stats: Dict[str, Dict] = {}      # cp -> {total, benar}
    subbab_salah: Dict[str, int] = {}   # subbab -> jumlah salah

    rows_jawaban = []
    for item in jawaban_list:
        soal = soal_map.get(item.soal_id)
        if not soal:
            continue
        benar = item.jawaban.upper() == soal["jawaban"].upper()
        cp = soal["cp"]
        subbab = soal["subbab"]

        rows_jawaban.append({
            "siswa_id": siswa_id,
            "soal_id": item.soal_id,
            "jawaban": item.jawaban.upper(),
            "benar": benar,
            "waktu": datetime.now(timezone.utc).isoformat(),
        })

        if cp not in cp_stats:
            cp_stats[cp] = {"total": 0, "benar": 0}
        cp_stats[cp]["total"] += 1
        if benar:
            cp_stats[cp]["benar"] += 1
        else:
            subbab_salah[subbab] = subbab_salah.get(subbab, 0) + 1

    # Insert jawaban_siswa (bulk)
    if rows_jawaban:
        db.table("jawaban_siswa").insert(rows_jawaban).execute()

    # Upsert skor_cp
    skor_per_cp: List[SkorCP] = []
    for cp, stat in cp_stats.items():
        persen = round(stat["benar"] / stat["total"] * 100, 1) if stat["total"] else 0
        status = _status_from_persen(persen)
        db.table("skor_cp").upsert(
            {
                "siswa_id": siswa_id,
                "cp": cp,
                "total_soal": stat["total"],
                "benar": stat["benar"],
                "persentase": persen,
                "status": status,
            },
            on_conflict="siswa_id,cp",
        ).execute()
        skor_per_cp.append(
            SkorCP(
                cp=cp,
                total_soal=stat["total"],
                benar=stat["benar"],
                persentase=persen,
                status=status,
            )
        )

    # Upsert weak_spot
    weak_spots: List[WeakSpot] = []
    for subbab, total_salah in subbab_salah.items():
        ws_status = "kritis" if total_salah >= 3 else "perlu_latihan"
        db.table("weak_spot").upsert(
            {
                "siswa_id": siswa_id,
                "subbab": subbab,
                "total_salah": total_salah,
                "status": ws_status,
            },
            on_conflict="siswa_id,subbab",
        ).execute()
        weak_spots.append(
            WeakSpot(subbab=subbab, total_salah=total_salah, status=ws_status)
        )

    return skor_per_cp, weak_spots
