"""
Test suite — KURMERDEKA-TRACE API
Jalankan: cd backend && pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app

client = TestClient(app)


# ── Health Check ──────────────────────────────────────────────────────────────

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "KURMERDEKA-TRACE" in data["app"]


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ── POST /api/quiz/submit ─────────────────────────────────────────────────────

def test_submit_quiz_siswa_tidak_ada():
    """Harus return 404 kalau siswa_id tidak ada di DB."""
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    with patch("app.routers.quiz.get_supabase", return_value=mock_db):
        response = client.post(
            "/api/quiz/submit",
            json={"siswa_id": 9999, "jawaban": [{"soal_id": 1, "jawaban": "A"}]},
        )
    assert response.status_code == 404


def test_submit_quiz_jawaban_kosong():
    """Harus return 400 kalau jawaban list kosong."""
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": 1}]

    with patch("app.routers.quiz.get_supabase", return_value=mock_db):
        response = client.post(
            "/api/quiz/submit",
            json={"siswa_id": 1, "jawaban": []},
        )
    assert response.status_code == 400


def test_submit_quiz_success():
    """Unit test scoring logic langsung — tanpa HTTP layer."""
    from app.services.scoring import proses_jawaban, _status_from_persen
    from app.models import JawabanItem

    mock_db = MagicMock()

    # Mock soal lookup
    mock_db.table("soal").select(
        "id, cp, subbab, jawaban"
    ).in_("id", [1, 2]).execute.return_value.data = [
        {"id": 1, "cp": "CP 3.1", "subbab": "ordo_matriks",    "jawaban": "A"},
        {"id": 2, "cp": "CP 3.1", "subbab": "elemen_matriks",  "jawaban": "C"},
    ]

    # Semua operasi insert/upsert return ok
    mock_db.table.return_value.insert.return_value.execute.return_value.data = [{}]
    mock_db.table.return_value.upsert.return_value.execute.return_value.data = [{}]

    jawaban_list = [
        JawabanItem(soal_id=1, jawaban="A"),   # benar
        JawabanItem(soal_id=2, jawaban="A"),   # salah (harusnya C)
    ]

    skor, weak = proses_jawaban(mock_db, siswa_id=1, jawaban_list=jawaban_list)

    assert len(skor) == 1
    assert skor[0].cp == "CP 3.1"
    assert skor[0].total_soal == 2
    assert skor[0].benar == 1
    assert skor[0].persentase == 50.0
    assert skor[0].status == "kuning"

    assert len(weak) == 1
    assert weak[0].subbab == "elemen_matriks"
    assert weak[0].total_salah == 1


# ── GET /api/student/{siswa_id} ───────────────────────────────────────────────

def test_get_student_not_found():
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = None

    with patch("app.routers.student.get_supabase", return_value=mock_db):
        response = client.get("/api/student/9999")
    assert response.status_code == 404


def test_get_student_success():
    mock_db = MagicMock()

    # Chain: table("siswa").select(...).eq(...).maybe_single().execute()
    siswa_mock = MagicMock()
    siswa_mock.execute.return_value.data = {"id": 1, "nama": "Andi Pratama", "kelas": "8A"}
    mock_db.table.return_value.select.return_value.eq.return_value.maybe_single.return_value = siswa_mock

    # Chain: table("skor_cp").select(...).eq(...).execute()
    skor_mock = MagicMock()
    skor_mock.execute.return_value.data = [
        {"cp": "CP 3.1", "total_soal": 5, "benar": 4, "persentase": 80.0, "status": "hijau"},
    ]

    # Chain: table("weak_spot").select(...).eq(...).execute()
    weak_mock = MagicMock()
    weak_mock.execute.return_value.data = []

    # Urutan pemanggilan table(): siswa, skor_cp, weak_spot
    mock_db.table.return_value.select.return_value.eq.return_value = MagicMock(
        maybe_single=MagicMock(return_value=siswa_mock),
        execute=MagicMock(side_effect=[
            MagicMock(data=[{"cp": "CP 3.1", "total_soal": 5, "benar": 4, "persentase": 80.0, "status": "hijau"}]),
            MagicMock(data=[]),
        ]),
    )

    with patch("app.routers.student.get_supabase", return_value=mock_db):
        response = client.get("/api/student/1")

    assert response.status_code == 200
    data = response.json()
    assert data["siswa_id"] == 1
    assert data["nama"] == "Andi Pratama"


# ── GET /api/dashboard/guru ───────────────────────────────────────────────────

def test_dashboard_guru():
    siswa_data = [
        {"id": 1, "nama": "Andi", "kelas": "8A"},
        {"id": 2, "nama": "Budi", "kelas": "8A"},
    ]
    skor_data = [
        {"siswa_id": 1, "status": "hijau"},
        {"siswa_id": 1, "status": "hijau"},
        {"siswa_id": 2, "status": "merah"},
    ]
    mock_db = MagicMock()

    with patch("app.routers.dashboard.get_supabase", return_value=mock_db), \
         patch("app.routers.dashboard._query_siswa", return_value=siswa_data), \
         patch("app.routers.dashboard._query_skor", return_value=skor_data):
        response = client.get("/api/dashboard/guru")

    assert response.status_code == 200
    data = response.json()
    assert data["ringkasan"]["total_siswa"] == 2
    assert data["ringkasan"]["total_hijau"] == 2
    assert data["ringkasan"]["total_merah"] == 1
    assert len(data["siswa"]) == 2


# ── POST /api/generate-soal ───────────────────────────────────────────────────

def test_generate_soal_invalid_subbab():
    response = client.post(
        "/api/generate-soal",
        json={"subbab": "subbab_tidak_ada", "level": "sedang", "jumlah": 3},
    )
    assert response.status_code == 400


def test_generate_soal_invalid_level():
    response = client.post(
        "/api/generate-soal",
        json={"subbab": "matriks_identitas", "level": "ekstrem", "jumlah": 3},
    )
    assert response.status_code == 400


def test_generate_soal_cache_hit():
    """Cache cukup → return dari DB tanpa panggil Groq."""
    from app.services.ai_generate import generate_soal as gen

    cached_rows = [
        {
            "id": 10 + i,
            "bab": "Matriks",
            "cp": "CP 3.3",
            "subbab": "matriks_identitas",
            "soal": f"Soal cache ke-{i+1}",
            "pilihan": ["A. x", "B. y", "C. z", "D. w"],
            "jawaban": "A",
            "penjelasan": "Penjelasan",
            "sumber": "ai",
        }
        for i in range(3)
    ]

    mock_db = MagicMock()
    # Simulasi chain: table("soal").select("*").eq(...).eq(...).limit(3).execute()
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = cached_rows

    result = gen(mock_db, "matriks_identitas", "sedang", 3)

    assert len(result) == 3
    assert all(r.sumber == "ai" for r in result)
    assert all(r.subbab == "matriks_identitas" for r in result)


# ── Scoring unit tests ────────────────────────────────────────────────────────

def test_status_dari_persentase():
    from app.services.scoring import _status_from_persen
    assert _status_from_persen(100) == "hijau"
    assert _status_from_persen(80)  == "hijau"
    assert _status_from_persen(79)  == "kuning"
    assert _status_from_persen(50)  == "kuning"
    assert _status_from_persen(49)  == "merah"
    assert _status_from_persen(0)   == "merah"
