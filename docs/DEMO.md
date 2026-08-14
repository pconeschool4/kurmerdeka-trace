# DEMO.md — Naskah Demo 3 Menit KURMERDEKA-TRACE

> **Untuk Juri / Audiens**  
> Platform ini mendemonstrasikan mesin penilaian adaptif berbasis CP Kurikulum Merdeka.  
> Demo menggunakan 1 bab (Matriks SMP Kelas 8) sebagai proof of concept.

---

## Persiapan Sebelum Demo (5 menit sebelum tampil)

- [ ] Backend berjalan: `uvicorn app.main:app --reload --port 8000`
- [ ] Frontend berjalan: `npm run dev` → buka **http://localhost:3000**
- [ ] Seed data ada: cek tabel `siswa` di Supabase ada 5 baris
- [ ] Browser sudah buka tab: `localhost:3000` dan `localhost:3000/guru`
- [ ] Koneksi internet stabil (untuk Groq API)

---

## [0:00 – 0:30] Opening — Perkenalkan Masalah

**Script:**
> *"Ini KURMERDEKA-TRACE — platform quiz adaptif yang ngikutin struktur CP Kurikulum Merdeka.*
>
> *Masalahnya sederhana: Kurikulum Merdeka bilang tiap siswa belajar sesuai kecepatan sendiri. Tapi platform yang ada — Ruangguru, Zenius, Pahamify — semuanya jalur linear. Guru cuma lihat nilai akhir, tidak tahu siswa lemah di subbab mana.*
>
> *Kita bangun mesin tracking per Capaian Pembelajaran, dengan AI yang generate soal remedial spesifik. Total biaya: Rp 0."*

**Aksi:** Tunjukkan halaman utama `localhost:3000`

---

## [0:30 – 1:00] Login Siswa & Pilih Quiz

**Script:**
> *"Misalnya saya adalah Andi, siswa kelas 8. Saya pilih bab Matriks, lalu pilih CP 3.1 — Pengertian & Ordo Matriks."*

**Aksi:**
1. Klik **CP 3.1** → tunggu soal muncul (spinner terlihat)
2. Tunjukkan 5 soal pilihan ganda
3. Jawab soal dengan **sengaja salah beberapa** (jawab salah soal 2, 3, 4):
   - Soal 1: Pilih **A** (benar)
   - Soal 2: Pilih **A** (salah, harusnya C)
   - Soal 3: Pilih **B** (salah, harusnya A)
   - Soal 4: Pilih **C** (salah, harusnya B)
   - Soal 5: Pilih **A** (benar? cek seed data)

---

## [1:00 – 1:30] Lihat Hasil → Sistem Detect Weak Spot

**Script:**
> *"Saya submit. Sistem langsung hitung: 2 benar dari 5 soal = 40% → MERAH.*
>
> *Yang penting bukan hanya merahnya — sistem tahu Andi lemah di subbab apa. Di sini terlihat: 'elemen_matriks' salah 2 kali. Bukan cuma nilai jelek, tapi diagnosis spesifik."*

**Aksi:**
1. Klik **Submit Jawaban** → tunggu hasil muncul
2. Tunjukkan card merah dengan persentase
3. Tunjukkan bagian **"Topik yang perlu dilatih"** dengan tombol **Latihan AI**

---

## [1:30 – 2:00] AI Generate Soal Remedial

**Script:**
> *"Andi klik 'Latihan AI'. Sistem panggil Groq API — Llama 3.1 — untuk generate soal spesifik tentang elemen matriks. Bukan soal umum, tapi soal yang didesain untuk kelemahan Andi.*
>
> *Dan kalau Groq sedang sibuk atau limit, sistem otomatis fallback ke soal manual — tidak crash."*

**Aksi:**
1. Klik **Latihan AI →** di samping topik lemah
2. Tunggu soal AI muncul (tunjukkan spinner + badge "✨ AI Generate")
3. Jawab semua soal dengan **benar** kali ini
4. Klik **Submit Latihan**
5. Tunjukkan hasil: status **naik jadi Hijau**

---

## [2:00 – 2:30] Dashboard Guru

**Script:**
> *"Sekarang saya ganti peran — ini view guru. Di sini guru bisa lihat semua 5 siswa sekaligus: berapa yang hijau, kuning, merah.*
>
> *Ada bar chart skor rata-rata per CP, dan pie chart distribusi status. Guru tidak perlu periksa satu per satu — langsung tahu kelas ada masalah di mana."*

**Aksi:**
1. Buka tab `localhost:3000/guru`
2. Tunjukkan 3 card besar (Hijau/Kuning/Merah)
3. Tunjukkan grafik bar chart dan pie chart
4. Tunjukkan tabel siswa dengan warna cell

---

## [2:30 – 3:00] Klik Siswa Merah → Detail Weak Spot

**Script:**
> *"Saya klik salah satu siswa yang merah — Andi. Muncul modal detail: skor per CP dengan progress bar, dan daftar topik lemah.*
>
> *Guru langsung tahu: 'Andi lemah di elemen_matriks, sudah salah 2 kali.' Rekomendasi muncul otomatis: minta siswa klik Latihan Tambahan.*
>
> *Ini baru 1 bab demo. Bayangkan kalau semua mata pelajaran dan semua kelas masuk ke sini — guru punya X-ray untuk setiap siswa, bukan hanya nilai angka."*

**Aksi:**
1. Klik **Detail →** di baris Andi (atau siswa yang sudah kerjakan quiz)
2. Tunjukkan modal dengan skor per CP + progress bar
3. Tunjukkan bagian topik lemah dengan rekomendasi
4. Tutup modal

---

## Tips Handling Masalah Saat Demo

| Masalah | Solusi |
|---------|--------|
| Soal tidak muncul | Refresh halaman, cek backend berjalan |
| Groq timeout | Klik Latihan AI lagi — akan fallback ke soal manual |
| Dashboard kosong | Pastikan seed data ada, klik Coba Lagi |
| Backend 500 error | Cek `.env` sudah diisi, restart uvicorn |
| Render cold start lambat | Buka URL backend 2 menit sebelum demo |

---

## Q&A Antisipasi

**Q: "Ini bedanya sama Ruangguru apa?"**
> A: Ruangguru jalur linear, konten video, tidak tahu CP. Kita tracking per Capaian Pembelajaran sesuai struktur Kurikulum Merdeka, dengan AI remedial yang spesifik per subbab.

**Q: "AI-nya canggih tidak?"**
> A: Kita jujur — ini Groq API (Llama 3.1) yang generate soal berdasarkan prompt. Bukan model ML custom. Tapi hasilnya cukup untuk demo: soal relevan, format JSON benar, cache efisien.

**Q: "Kalau dikembangkan lebih lanjut?"**
> A: Tambah semua mata pelajaran, login per siswa (sudah ada Supabase Auth), adaptive difficulty berdasarkan history jawaban, dan notifikasi push ke guru kalau ada siswa yang merah.

**Q: "Biayanya berapa untuk skala sekolah?"**
> A: Supabase free tier cukup untuk ~500 siswa. Groq 1 juta token/hari cukup untuk ratusan generate soal. Render free tier untuk backend. Total: Rp 0 untuk proof of concept.
