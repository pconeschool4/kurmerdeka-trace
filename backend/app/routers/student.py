"""
GET /api/student/{siswa_id}
"""
from fastapi import APIRouter, HTTPException
from app.database import get_supabase
from app.models import StudentResponse, SkorCP, WeakSpot

router = APIRouter(prefix="/api/student", tags=["student"])


@router.get("/{siswa_id}", response_model=StudentResponse)
def get_student(siswa_id: int):
    db = get_supabase()

    # Ambil data siswa
    siswa_result = (
        db.table("siswa")
        .select("id, nama, kelas")
        .eq("id", siswa_id)
        .maybe_single()
        .execute()
    )
    if not siswa_result.data:
        raise HTTPException(status_code=404, detail=f"Siswa id={siswa_id} tidak ditemukan")

    siswa = siswa_result.data

    # Ambil skor_cp
    skor_rows = (
        db.table("skor_cp")
        .select("cp, total_soal, benar, persentase, status")
        .eq("siswa_id", siswa_id)
        .execute()
        .data
    )
    skor_per_cp = [
        SkorCP(
            cp=r["cp"],
            total_soal=r["total_soal"],
            benar=r["benar"],
            persentase=r["persentase"],
            status=r["status"],
        )
        for r in skor_rows
    ]

    # Ambil weak_spot
    ws_rows = (
        db.table("weak_spot")
        .select("subbab, total_salah, status")
        .eq("siswa_id", siswa_id)
        .execute()
        .data
    )
    weak_spots = [
        WeakSpot(subbab=r["subbab"], total_salah=r["total_salah"], status=r["status"])
        for r in ws_rows
    ]

    return StudentResponse(
        siswa_id=siswa["id"],
        nama=siswa["nama"],
        kelas=siswa["kelas"],
        skor_per_cp=skor_per_cp,
        weak_spots=weak_spots,
    )
