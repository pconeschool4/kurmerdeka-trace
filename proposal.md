# KURMERDEKA-TRACE
### Adaptive Quiz Platform untuk Kurikulum Merdeka — Tracking & Remedial Otomatis per CP/TP

**Dokumen:** Proposal Teknis & Prompt Anti Gravity  
**Deadline:** 5 hari (target selesai hari ke-3)  
**Stack:** Next.js (Frontend) + Python FastAPI (Backend) + Supabase (DB) + Groq API (AI Generate Soal)  
**Modal:** Rp 0 (semua tools free tier)

---

## 1. Masalah (Kenapa Ini Penting)

Kurikulum Merdeka bilang: **tiap siswa belajar sesuai kecepatan sendiri**. Tapi realitanya:
- Ruangguru, Zenius, Pahamify = jalur linear (bab 1 → 2 → 3, semua siswa sama)
- Yang cepat bosan, yang lambat ditinggal
- Guru tidak punya tools untuk tracking **per Capaian Pembelajaran (CP)** — hanya nilai akhir
- Tidak ada platform open-source yang benar-benar ngikutin struktur CP/TP Kurikulum Merdeka

## 2. Solusi (Apa yang Dibuat)

Platform quiz dengan **tiga fitur utama**:

| Fitur | Deskripsi | Contoh |
|-------|-----------|--------|
| **1. Quiz Per CP** | Siswa jawab soal per Capaian Pembelajaran | CP 3.1 Bilangan Bulat → 5 soal |
| **2. Dashboard Guru** | Lihat 40 siswa: hijau (mastery), kuning (hampir), merah (butuh bantuan) | Klik merah → detail lemah di subbab apa |
| **3. AI Generate Soal Adaptif** | Kalau siswa merah di subbab spesifik, AI generate latihan khusus itu | Matriks identitas salah 3x → AI buat 3 soal matriks identitas tambahan |

## 3. Kenapa Belum Ada yang Bikin

- Edtech existing lomba di **konten video** (mahal, glamor)
- Tidak ada yang bangun **mesin penilaian adaptif** khusus Kurikulum Merdeka
- Struktur CP/TP unik Indonesia — platform luar tidak mengerti
- Yang open-source (Moodle, Canvas) = generic, tidak ngerti CP/TP

## 4. Arsitektur (Efisien, Minimal, Berfungsi)

```
[Frontend: Next.js + Tailwind + Recharts]
    │
    ▼
[Backend: Python FastAPI]
    ├── /api/quiz/submit     → hitung skor, detect weak spot
    ├── /api/student/{id}    → dashboard data
    └── /api/generate-soal   → panggil Groq API
    │
    ▼
[Database: Supabase PostgreSQL]
    ├── siswa, jawaban, skor_cp
    ├── soal_manual (bank soal dari buku Kemendikbud)
    └── soal_ai_cache (cache hasil generate, hemat API)
    │
    ▼
[AI: Groq API Free Tier]
    └── Generate soal spesifik subbab (1M tokens/hari)
```

**Prinsip efisiensi:**
- Kode sedikit tapi berfungsi, bukan banyak tapi buggy
- Cache AI generate soal — jangan panggil API berulang untuk subbab sama
- 1 bab demo saja (Matriks SMP Kelas 8) — cukup untuk proof of concept

## 5. Database (Minimal, Cukup untuk Demo)

```sql
-- siswa
id | nama | kelas

-- soal (manual + AI cache)
id | bab | cp | subbab | soal | pilihan[] | jawaban | penjelasan | sumber (manual/ai)

-- jawaban_siswa
id | siswa_id | soal_id | jawaban | benar | waktu

-- skor_cp (auto-generate dari jawaban)
siswa_id | cp | total_soal | benar | persentase | status (hijau/kuning/merah)

-- weak_spot (auto-generate)
siswa_id | subbab | total_salah | status
```

## 6. Alur Kerja Sistem

```
Siswa login → Pilih bab (Matriks) → Jawab 5 soal CP 3.1
    ↓
Sistem hitung: 2 benar / 5 = 40% → MERAH
    ↓
Sistem detect: salah semua di subbab "matriks identitas"
    ↓
Sistem tampilkan: "Kamu butuh latihan matriks identitas"
    ↓
Klik "Latihan Tambahan" → Panggil Groq API → Generate 3 soal matriks identitas
    ↓
Siswa kerjakan → Skor naik → Status hijau → Bisa lanjut CP 3.2

Guru login → Dashboard → Lihat 40 siswa
    → Hijau: 15 siswa | Kuning: 18 siswa | Merah: 7 siswa
    → Klik merah → Detail: "Andi lemah di CP 3.4 subbab matriks identitas"
```

## 7. AI Generate Soal (Groq API)

**Prompt template:**
```
Generate {jumlah} soal pilihan ganda tentang {subbab} 
dari materi {bab} untuk kelas {kelas}.
Tingkat kesulitan: {level}

Format JSON:
[{
  "soal": "...",
  "pilihan": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "jawaban": "A",
  "penjelasan": "..."
}]

Contoh matriks identitas dasar:
"Jika I adalah matriks identitas ordo 2x2, maka I = ..."
```

**Trick hemat token:**
- Cache hasil generate di database (soal_ai_cache)
- Kalau subbab sama diminta lagi, ambil dari cache — jangan panggil API
- 1M tokens/hari = ~500-1000 soal generate — cukup untuk demo

## 8. 3 Langkah Anti Gravity (3 Hari Selesai)

### LANGKAH 0 — Setup Manual (Kamu, 30 menit, sebelum Anti Gravity)

```bash
mkdir kurmerdeka-trace && cd kurmerdeka-trace
git init
mkdir -p frontend backend/app database docs
```

**Siapkan data awal manual (buku Kemendikbud PDF):**
- 1 Bab: Matriks (SMP Kelas 8)
- 3 CP: CP 3.1, CP 3.2, CP 3.3
- 15 soal manual (5 per CP) dari buku / generate pakai ChatGPT gratis
- Simpan di `database/soal_seed.json`

**Daftar akun gratis:**
- Supabase (database): supabase.com — buat project, copy connection string
- Groq (AI): groq.com — buat API key
- Vercel (deploy): vercel.com

---

### LANGKAH 1 — Backend + Database (Hari 1)

**Prompt Anti Gravity (satu kali submit):**

```
Baca proposal.md di root repo ini. Bangun backend/ (Python FastAPI) + database/ (Supabase PostgreSQL) sesuai arsitektur di Bab 4-5.

TUGAS:
1. Database: Buat tabel siswa, soal, jawaban_siswa, skor_cp, weak_spot menggunakan Supabase client Python. Siapkan seed data dari database/soal_seed.json (15 soal matriks SMP Kelas 8).

2. API Endpoints:
   POST /api/quiz/submit — terima {siswa_id, jawaban: [{soal_id, jawaban}]}
   → hitung benar/salah → insert jawaban_siswa → update skor_cp → update weak_spot
   → return {skor_per_cp, status_per_cp, weak_spots}

   GET /api/student/{siswa_id} — return semua skor CP + status + weak spots

   GET /api/dashboard/guru — return ringkasan semua siswa: total hijau/kuning/merah

3. AI Generate Soal:
   POST /api/generate-soal — terima {subbab, level, jumlah}
   → check cache dulu (tabel soal, kolom sumber='ai', subbab match)
   → kalau tidak ada, panggil Groq API dengan prompt template di proposal Bab 7
   → parse JSON response → save ke soal (sumber='ai') → return soal
   → handle rate limit: kalau Groq error, return soal manual dari cache

4. Requirements: FastAPI, supabase-py, groq, pydantic. requirements.txt lengkap.

BATASAN:
- Jangan buat frontend di langkah ini
- Jangan download model ML — pure API + database
- Test dengan pytest atau curl: submit jawaban → cek skor_cp berubah
- Di akhir, tulis cara jalankan: uvicorn + test curl
```

**Setelah selesai:** `git commit -m "feat: backend + db + ai generate"`

---

### LANGKAH 2 — Frontend Dashboard (Hari 2)

**Prompt Anti Gravity (satu kali submit):**

```
Backend sudah jalan di backend/app/main.py dengan endpoint:
- POST /api/quiz/submit
- GET /api/student/{id}
- GET /api/dashboard/guru
- POST /api/generate-soal

Bangun frontend/ (Next.js + Tailwind + Recharts) — satu halaman utama dengan dua view:

VIEW SISWA (/):
- Card pilih bab: "Matriks Kelas 8"
- Quiz: tampilkan 5 soal pilihan ganda, submit → tampilkan hasil
  → hijau (≥80%), kuning (50-79%), merah (<50%)
- Kalau merah/kuning: tombol "Latihan Tambahan" → panggil /api/generate-soal
  → tampilkan soal AI generate → jawab → skor update

VIEW GURU (/guru):
- Dashboard: 3 card besar — Hijau: X siswa, Kuning: Y, Merah: Z
- Tabel siswa: nama | CP 3.1 | CP 3.2 | CP 3.3 | status
  → warna cell hijau/kuning/merah
- Klik siswa → modal detail: weak spots + rekomendasi

Chart: Recharts — bar chart skor rata-rata per CP, pie chart distribusi status

Styling: Tailwind — clean, minimal, fokus fungsi. Jangan animasi berlebihan.
Koneksi ke backend via fetch, URL di .env.local (default http://localhost:8000)

BATASAN:
- Jangan ubah backend
- 1 bab demo saja (Matriks)
- Prioritaskan: submit quiz → hitung → tampilkan warna → generate soal AI → latihan
```

**Setelah selesai:** `git commit -m "feat: frontend dashboard siswa+guru"`

---

### LANGKAH 3 — Polish + Deploy (Hari 3)

**Prompt Anti Gravity (satu kali submit):**

```
Sistem sudah jalan: backend (FastAPI) + frontend (Next.js) + database (Supabase) + AI (Groq).

TUGAS POLISH:
1. Error handling: kalau Groq limit/timeout, fallback ke soal manual dari cache — jangan crash
2. Loading state: tombol submit ada spinner, jangan bikin user bingung
3. Responsive: tabel guru bisa di-scroll di HP
4. Deploy: 
   - Frontend → Vercel (next build, vercel --prod)
   - Backend → Render free tier (python + uvicorn)
   - Tulis .env.example untuk semua config

5. README.md root: cara jalankan lokal (step by step) + link deploy

6. docs/DEMO.md: naskah demo 3 menit untuk juri:
   - Login sebagai siswa → jawab quiz → dapat merah → latihan AI → hijau
   - Login sebagai guru → lihat dashboard → klik siswa merah → detail weak spot

BATASAN:
- Jangan tambah fitur baru — polish yang ada saja
- Jangan ubah struktur database
- Target: bisa demo end-to-end tanpa error
```

**Setelah selesai:** `git commit -m "feat: polish + deploy + demo script"`

---

## 9. Demo Script (3 Menit untuk Juri)

```
[0:00] "Ini KURMERDEKA-TRACE — platform quiz yang ngikutin struktur CP Kurikulum Merdeka."

[0:30] Login siswa → Pilih Matriks → Jawab 5 soal CP 3.1 (sengaja salah beberapa)

[1:00] Hasil: merah di CP 3.1, sistem detect lemah di subbab "matriks identitas"

[1:30] Klik "Latihan Tambahan" → AI generate 3 soal matriks identitas khusus → Kerjakan → Hijau

[2:00] Login guru → Dashboard: 40 siswa, ada hijau/kuning/merah

[2:30] Klik siswa merah → Detail: "Andi lemah di CP 3.4 subbab matriks identitas, butuh latihan"

[3:00] "Ini baru demo 1 bab. Bayangkan kalau semua mata pelajaran + semua kelas."
```

## 10. Kenapa Ini Bisa Selesai 3 Hari

| Hari | Fokus | Output |
|------|-------|--------|
| 1 | Backend + DB + AI | API jalan, database berisi soal |
| 2 | Frontend | Dashboard siswa + guru berfungsi |
| 3 | Polish + Deploy | Bisa demo tanpa error |

**Kunci:**
- 1 bab demo saja (Matriks) — jangan semua pelajaran
- 15 soal manual + AI generate untuk demo — tidak perlu ribuan soal
- Cache AI — jangan generate berulang
- Kode efisien > kode banyak — kalau 100 baris cukup, jangan 1000

---

## 11. Batasan & Kejujuran (Untuk Guru/Juri)

| Klaim | Realita |
|-------|---------|
| "Sistem tahu siswa lemah di CP 3.4" | Hitung persentase benar — bukan AI prediksi canggih |
| "AI generate soal" | Groq API free tier, generate spesifik subbab — bukan semua subbab otomatis |
| "Real-time dashboard" | Database query — bukan streaming live |
| "Untuk demo" | 1 bab (Matriks). Full kurikulum butuh data + waktu lebih. |

**Framing:** "Ini proof of concept mesin adaptif untuk Kurikulum Merdeka — yang belum ada di platform manapun."

---

## 12. Stack Detail (Semua Gratis)

| Layer | Tool | Biaya |
|-------|------|-------|
| Frontend | Next.js + Tailwind + Recharts | Vercel free = Rp 0 |
| Backend | Python FastAPI | Render free = Rp 0 |
| Database | Supabase PostgreSQL | Free tier 500MB = Rp 0 |
| AI | Groq API (Llama 3.1) | 1M tokens/hari = Rp 0 |
| Auth | Supabase Auth (opsional demo) | Free = Rp 0 |

---

**Total: Rp 0. Target: 3 hari. Fokus: berfungsi, bukan sempurna.**
