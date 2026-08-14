# KURMERDEKA-TRACE

**Adaptive Quiz Platform untuk Kurikulum Merdeka — Tracking & Remedial Otomatis per CP/TP**

> Proof of concept mesin penilaian adaptif yang ngikutin struktur CP Kurikulum Merdeka — yang belum ada di platform manapun.

**Stack:** Next.js 16 · Python FastAPI · Supabase PostgreSQL · Groq API (Llama 3.1)  
**Biaya:** Rp 0 (semua free tier)

---

## 🚀 Cara Jalankan Lokal (Step by Step)

### Prasyarat
- Python 3.12+ → [python.org](https://python.org)
- Node.js 18+ → [nodejs.org](https://nodejs.org)
- Akun Supabase → [supabase.com](https://supabase.com)
- Akun Groq → [console.groq.com](https://console.groq.com)

---

### Langkah 1 — Setup Database Supabase

1. Buka [supabase.com](https://supabase.com) → buat project baru
2. Masuk ke **SQL Editor** → klik **New Query**
3. Paste seluruh isi file [`database/schema.sql`](database/schema.sql) → klik **Run**
4. Semua tabel akan terbuat: `siswa`, `soal`, `jawaban_siswa`, `skor_cp`, `weak_spot`
5. Ambil kredensial di **Project Settings → API**:
   - `Project URL` → untuk `SUPABASE_URL`
   - `service_role` secret key (klik reveal) → untuk `SUPABASE_KEY`

---

### Langkah 2 — Setup Backend

```bash
# Dari root repo
cd backend

# Copy file environment
copy .env.example .env
```

Edit `backend/.env`:
```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGci...your-service-role-key-here
GROQ_API_KEY=gsk_your_groq_api_key_here
APP_ENV=development
```

> **Penting:** `SUPABASE_KEY` harus berupa JWT panjang yang diawali `eyJ`, bukan format lain.

Install dependencies dan seed database:
```bash
# Install Python packages
python -m pip install -r requirements.txt

# Isi tabel siswa (5 siswa demo) + soal (15 soal Matriks)
python ../database/init_db.py
```

Jalankan server backend:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

✅ Backend berjalan di: **http://localhost:8000**  
📖 Docs interaktif (Swagger): **http://localhost:8000/docs**

---

### Langkah 3 — Setup Frontend

Buka terminal baru (backend tetap jalan):

```bash
# Dari root repo
cd frontend

# Copy file environment
copy .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Install dan jalankan:
```bash
npm install
npm run dev
```

✅ Frontend berjalan di: **http://localhost:3000**

---

### Langkah 4 — Test Curl (Opsional)

Pastikan backend sudah jalan, lalu:

```bash
# Health check
curl http://localhost:8000/health

# Submit jawaban quiz (siswa_id=1, soal 1-5)
curl -X POST http://localhost:8000/api/quiz/submit ^
  -H "Content-Type: application/json" ^
  -d "{\"siswa_id\":1,\"jawaban\":[{\"soal_id\":1,\"jawaban\":\"A\"},{\"soal_id\":2,\"jawaban\":\"A\"},{\"soal_id\":3,\"jawaban\":\"B\"},{\"soal_id\":4,\"jawaban\":\"C\"},{\"soal_id\":5,\"jawaban\":\"A\"}]}"

# Lihat skor siswa
curl http://localhost:8000/api/student/1

# Dashboard guru
curl http://localhost:8000/api/dashboard/guru

# Generate soal AI
curl -X POST http://localhost:8000/api/generate-soal ^
  -H "Content-Type: application/json" ^
  -d "{\"subbab\":\"matriks_identitas\",\"level\":\"sedang\",\"jumlah\":3}"
```

---

## 🌐 Deploy (Produksi)

### Frontend → Vercel

1. Push repo ke GitHub
2. Buka [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Set **Root Directory** ke `frontend`
4. Tambahkan environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://kurmerdeka-trace-api.onrender.com
   ```
5. Klik **Deploy**

### Backend → Render

1. Buka [render.com](https://render.com) → **New Web Service**
2. Connect repo GitHub → Render akan otomatis detect `render.yaml`
3. Tambahkan environment variables di Render Dashboard:
   ```
   SUPABASE_URL  = https://xxxx.supabase.co
   SUPABASE_KEY  = eyJhbGci...
   GROQ_API_KEY  = gsk_...
   ```
4. Klik **Deploy**

> **Catatan:** Render free tier akan sleep setelah 15 menit tidak ada request. Cold start ~30 detik — normal untuk demo.

### Setelah Deploy
Update `NEXT_PUBLIC_API_URL` di Vercel dengan URL Render kamu, lalu redeploy frontend.

**Link Deploy:**
- Frontend: *(isi setelah deploy Vercel)*
- Backend API: *(isi setelah deploy Render)*

---

## 🗂️ Struktur Proyek

```
kurmerdeka-trace/
├── backend/
│   ├── app/
│   │   ├── main.py          — FastAPI app + CORS
│   │   ├── database.py      — Supabase client
│   │   ├── models.py        — Pydantic schemas
│   │   ├── routers/         — Endpoints (quiz, student, dashboard, generate)
│   │   └── services/        — Logika (scoring, ai_generate)
│   ├── tests/test_api.py    — 12 unit tests (pytest)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx         — View Siswa (quiz flow)
│   │   └── guru/page.tsx    — Dashboard Guru
│   ├── src/components/
│   │   └── Charts.tsx       — Recharts (bar + pie)
│   ├── src/lib/
│   │   ├── api.ts           — Fetch client
│   │   └── utils.ts         — Color helpers
│   └── .env.example
├── database/
│   ├── schema.sql           — DDL semua tabel
│   ├── init_db.py           — Seeder
│   └── soal_seed.json       — 15 soal Matriks
├── docs/
│   └── DEMO.md              — Naskah demo 3 menit
├── render.yaml              — Render deploy config
└── proposal.md
```

---

## 📊 Logika Penilaian

| Persentase Benar | Status | Keterangan |
|-----------------|--------|------------|
| ≥ 80% | 🟢 Hijau | Mastery — siap lanjut |
| 50–79% | 🟡 Kuning | Hampir — perlu review |
| < 50% | 🔴 Merah | Butuh latihan tambahan |

**Alur AI Generate Soal:**
```
Request generate-soal
    ↓
Cek cache DB (sumber='ai', subbab match)
    ├── Cache ada → return langsung (0 Groq token)
    └── Cache kosong → panggil Groq API (Llama 3.1)
            ├── Sukses → simpan ke DB → return
            └── Rate limit/error → fallback soal manual
```

---

## 🧪 Menjalankan Tests

```bash
cd backend
python -m pytest tests/ -v
```

Expected: **12 passed** dalam < 2 detik (semua pakai mock, tidak butuh koneksi DB)

---

## ⚖️ Batasan & Kejujuran

| Klaim | Realita |
|-------|---------|
| "Sistem tahu siswa lemah di CP 3.4" | Hitung % benar — bukan AI prediksi |
| "AI generate soal" | Groq API free tier, subbab spesifik |
| "Real-time dashboard" | Database query biasa |
| "Untuk demo" | 1 bab (Matriks). Full kurikulum butuh data lebih |

**Total biaya: Rp 0. Selesai dalam 3 hari. Fokus: berfungsi, bukan sempurna.**
