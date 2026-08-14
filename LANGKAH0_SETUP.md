# LANGKAH 0 — Setup Manual (Sebelum Anti Gravity)

## 1. Buat Folder
```bash
mkdir kurmerdeka-trace && cd kurmerdeka-trace
git init
mkdir -p frontend backend/app database docs
```

## 2. Siapkan Data Awal
- Buka buku Kemendikbud PDF (Matematika SMP Kelas 8 — Bab Matriks)
- Buat 15 soal manual (5 per CP) dalam format JSON
- Simpan sebagai `database/soal_seed.json`

Contoh format:
```json
[
  {
    "bab": "Matriks",
    "cp": "CP 3.1",
    "subbab": "matriks_identitas",
    "soal": "Jika I adalah matriks identitas ordo 2x2, maka I = ...",
    "pilihan": ["A. [1 0; 0 1]", "B. [0 1; 1 0]", "C. [1 1; 0 0]", "D. [0 0; 1 1]"],
    "jawaban": "A",
    "penjelasan": "Matriks identitas punya 1 di diagonal utama, 0 lainnya"
  }
]
```

## 3. Daftar Akun Gratis (Lakukan Sekarang)
- **Supabase**: https://supabase.com → Buat project → Copy `DATABASE_URL`
- **Groq**: https://groq.com → Buat API Key → Copy key
- **Vercel**: https://vercel.com → Install CLI (opsional, untuk deploy nanti)

## 4. Commit Awal
```bash
git add -A
git commit -m "chore: scaffold + soal seed"
```

## 5. Buka Anti Gravity
- Buka folder `kurmerdeka-trace/` di Anti Gravity
- Siapkan `proposal.md` (file yang ini) di root
- Mulai Langkah 1
