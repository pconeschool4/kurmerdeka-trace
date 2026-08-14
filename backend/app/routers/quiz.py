"""
POST /api/quiz/submit
"""
from fastapi import APIRouter, HTTPException
from app.database import get_supabase
from app.models import SubmitQuizRequest, SubmitQuizResponse
from app.services.scoring import proses_jawaban

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/submit", response_model=SubmitQuizResponse)
def submit_quiz(body: SubmitQuizRequest):
    db = get_supabase()

    # Validasi siswa ada
    siswa_result = (
        db.table("siswa").select("id").eq("id", body.siswa_id).execute()
    )
    if not siswa_result.data:
        raise HTTPException(status_code=404, detail=f"Siswa id={body.siswa_id} tidak ditemukan")

    if not body.jawaban:
        raise HTTPException(status_code=400, detail="Daftar jawaban kosong")

    skor_per_cp, weak_spots = proses_jawaban(db, body.siswa_id, body.jawaban)

    status_per_cp = {s.cp: s.status for s in skor_per_cp}

    return SubmitQuizResponse(
        skor_per_cp=skor_per_cp,
        status_per_cp=status_per_cp,
        weak_spots=weak_spots,
    )
