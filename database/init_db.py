"""
init_db.py — Buat tabel di Supabase menggunakan SQL via RPC, lalu seed dari soal_seed.json.

Jalankan SEKALI sebelum uvicorn:
    cd backend
    python ../database/init_db.py

Atau dari root:
    python database/init_db.py

Catatan: Supabase free tier tidak support CREATE TABLE via supabase-py langsung.
Script ini menggunakan Supabase Management API (REST) dengan service_role key.
Alternatif: jalankan SQL di Supabase SQL Editor (lihat database/schema.sql).
"""
import sys
import os
import json
from pathlib import Path

# Tambahkan backend ke path agar bisa import app.database
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.database import get_supabase, get_settings

SEED_FILE = Path(__file__).parent / "soal_seed.json"

# ── Siswa demo ─────────────────────────────────────────────────────────────────
SISWA_DEMO = [
    {"nama": "Andi Pratama", "kelas": "8A"},
    {"nama": "Budi Santoso", "kelas": "8A"},
    {"nama": "Citra Dewi", "kelas": "8B"},
    {"nama": "Dina Rahayu", "kelas": "8B"},
    {"nama": "Eko Wijaya", "kelas": "8C"},
]


def seed_siswa(db):
    print("→ Seeding tabel siswa...")
    existing = db.table("siswa").select("id").execute().data
    if existing:
        print(f"  Sudah ada {len(existing)} siswa, skip.")
        return
    result = db.table("siswa").insert(SISWA_DEMO).execute()
    print(f"  Inserted {len(result.data)} siswa.")


def seed_soal(db):
    print("→ Seeding tabel soal dari soal_seed.json...")
    existing = db.table("soal").select("id").eq("sumber", "manual").execute().data
    if existing:
        print(f"  Sudah ada {len(existing)} soal manual, skip.")
        return

    with open(SEED_FILE, encoding="utf-8") as f:
        soal_list = json.load(f)

    # Tambahkan kolom sumber='manual'
    for s in soal_list:
        s["sumber"] = "manual"

    result = db.table("soal").insert(soal_list).execute()
    print(f"  Inserted {len(result.data)} soal.")


def main():
    print("=" * 50)
    print("KURMERDEKA-TRACE — Database Seeder")
    print("=" * 50)

    try:
        db = get_supabase()
        seed_siswa(db)
        seed_soal(db)
        print("\n✓ Seeding selesai!")
        print("\nCatatan: Pastikan tabel sudah dibuat terlebih dahulu.")
        print("Jalankan SQL di database/schema.sql via Supabase SQL Editor.")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nPastikan:")
        print("  1. File backend/.env sudah diisi (SUPABASE_URL, SUPABASE_KEY)")
        print("  2. Tabel sudah dibuat via database/schema.sql")
        sys.exit(1)


if __name__ == "__main__":
    main()
