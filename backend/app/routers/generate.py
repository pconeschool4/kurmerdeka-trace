"""
POST /api/generate-soal
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_supabase
from app.models import GenerateSoalRequest, SoalItem
from app.services.ai_generate import generate_soal

router = APIRouter(prefix="/api", tags=["ai-generate"])

VALID_SUBBAB = {
    "ordo_matriks",
    "elemen_matriks",
    "pengertian_matriks",
    "penjumlahan_matriks",
    "pengurangan_matriks",
    "perkalian_skalar",
    "matriks_identitas",
    "perkalian_matriks",
}

VALID_LEVEL = {"mudah", "sedang", "sulit"}


@router.post("/generate-soal", response_model=List[SoalItem])
def generate_soal_endpoint(body: GenerateSoalRequest):
    if body.subbab not in VALID_SUBBAB:
        raise HTTPException(
            status_code=400,
            detail=f"subbab tidak valid. Pilihan: {sorted(VALID_SUBBAB)}",
        )
    if body.level not in VALID_LEVEL:
        raise HTTPException(
            status_code=400,
            detail=f"level tidak valid. Pilihan: {sorted(VALID_LEVEL)}",
        )
    if not (1 <= body.jumlah <= 10):
        raise HTTPException(status_code=400, detail="jumlah harus antara 1-10")

    db = get_supabase()
    soal_list = generate_soal(db, body.subbab, body.level, body.jumlah, body.tingkat_pendidikan)

    if not soal_list:
        raise HTTPException(status_code=503, detail="Tidak bisa generate soal saat ini, coba lagi nanti")

    return soal_list
