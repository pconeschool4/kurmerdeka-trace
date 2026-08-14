"""
Pydantic request/response models untuk semua endpoint.
"""
from typing import List, Optional
from pydantic import BaseModel


# ─── Request Bodies ───────────────────────────────────────────────────────────

class JawabanItem(BaseModel):
    soal_id: int
    jawaban: str  # "A" | "B" | "C" | "D"


class SubmitQuizRequest(BaseModel):
    siswa_id: int
    jawaban: List[JawabanItem]


class GenerateSoalRequest(BaseModel):
    subbab: str          # e.g. "matriks_identitas"
    level: str = "sedang"  # "mudah" | "sedang" | "sulit"
    jumlah: int = 3
    tingkat_pendidikan: str = "SMP Kelas 8"


# ─── Response Bodies ──────────────────────────────────────────────────────────

class SkorCP(BaseModel):
    cp: str
    total_soal: int
    benar: int
    persentase: float
    status: str  # "hijau" | "kuning" | "merah"


class WeakSpot(BaseModel):
    subbab: str
    total_salah: int
    status: str


class SubmitQuizResponse(BaseModel):
    skor_per_cp: List[SkorCP]
    status_per_cp: dict
    weak_spots: List[WeakSpot]


class StudentResponse(BaseModel):
    siswa_id: int
    nama: str
    kelas: str
    skor_per_cp: List[SkorCP]
    weak_spots: List[WeakSpot]


class SiswaRingkasan(BaseModel):
    siswa_id: int
    nama: str
    kelas: str
    total_hijau: int
    total_kuning: int
    total_merah: int
    status_dominan: str


class DashboardGuruResponse(BaseModel):
    ringkasan: dict
    siswa: List[SiswaRingkasan]


class SoalItem(BaseModel):
    id: Optional[int] = None
    bab: str
    cp: str
    subbab: str
    soal: str
    pilihan: List[str]
    jawaban: str
    penjelasan: str
    sumber: str  # "manual" | "ai"
