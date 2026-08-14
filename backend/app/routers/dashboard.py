"""
GET /api/dashboard/guru
"""
from fastapi import APIRouter
from app.database import get_supabase
from app.models import DashboardGuruResponse, SiswaRingkasan

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _query_siswa(db):
    return db.table("siswa").select("id, nama, kelas").execute().data


def _query_skor(db):
    return db.table("skor_cp").select("siswa_id, status").execute().data


@router.get("/guru", response_model=DashboardGuruResponse)
def dashboard_guru():
    db = get_supabase()

    # Ambil semua siswa
    semua_siswa = _query_siswa(db)

    # Ambil semua skor_cp sekaligus (efisien, 1 query)
    semua_skor = _query_skor(db)

    # Index skor per siswa_id
    skor_by_siswa: dict = {}
    for s in semua_skor:
        sid = s["siswa_id"]
        skor_by_siswa.setdefault(sid, []).append(s["status"])

    total_hijau = total_kuning = total_merah = 0
    ringkasan_siswa: list[SiswaRingkasan] = []

    for siswa in semua_siswa:
        sid = siswa.get("id")
        statuses = skor_by_siswa.get(sid, [])
        h = statuses.count("hijau")
        k = statuses.count("kuning")
        m = statuses.count("merah")

        if not statuses:
            dominan = "belum_kuis"
        elif m > 0:
            dominan = "merah"
        elif k > 0:
            dominan = "kuning"
        else:
            dominan = "hijau"

        total_hijau += h
        total_kuning += k
        total_merah += m

        ringkasan_siswa.append(
            SiswaRingkasan(
                siswa_id=sid,
                nama=siswa["nama"],
                kelas=siswa["kelas"],
                total_hijau=h,
                total_kuning=k,
                total_merah=m,
                status_dominan=dominan,
            )
        )

    ringkasan = {
        "total_siswa": len(semua_siswa),
        "total_hijau": total_hijau,
        "total_kuning": total_kuning,
        "total_merah": total_merah,
    }

    return DashboardGuruResponse(ringkasan=ringkasan, siswa=ringkasan_siswa)
