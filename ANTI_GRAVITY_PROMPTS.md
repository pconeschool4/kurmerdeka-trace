# ANTI GRAVITY PROMPTS — KURMERDEKA-TRACE
## 3 Langkah, 3 Hari, Modal 0

---

# LANGKAH 1 — Prompt Anti Gravity (Hari 1: Backend + DB + AI)

```
Baca proposal.md di root repo ini. Bangun backend/ (Python FastAPI) + database/ (Supabase PostgreSQL) sesuai arsitektur di Bab 4-5 proposal.

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


---

# LANGKAH 2 — Prompt Anti Gravity (Hari 2: Frontend Dashboard)

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


---

# LANGKAH 3 — Prompt Anti Gravity (Hari 3: Polish + Deploy)

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


---

## Catatan Penting

1. Setiap langkah = 1 prompt besar, 1 kali submit ke Anti Gravity
2. Setelah selesai: `git add -A && git commit -m "feat: langkah X"`
3. Kalau ada bug kecil → perbaiki manual dulu, jangan langsung prompt baru
4. Kalau bug besar → prompt susulan singkat, spesifik file + error
5. Target: demo jalan, bukan sempurna
