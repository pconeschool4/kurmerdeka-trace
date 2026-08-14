import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.database import get_supabase

def main():
    print("=" * 50)
    print("MENGHAPUS RIWAYAT PENGERJAAN SISWA & CACHE AI")
    print("=" * 50)
    
    try:
        db = get_supabase()
        
        # 1. Hapus tabel dependen (jawaban, weak_spot, skor)
        print("Menghapus jawaban_siswa...")
        db.table("jawaban_siswa").delete().neq("id", 0).execute()
        
        print("Menghapus weak_spot...")
        db.table("weak_spot").delete().neq("id", 0).execute()
        
        print("Menghapus skor_cp...")
        db.table("skor_cp").delete().neq("id", 0).execute()
        
        # 2. Hapus cache soal AI
        print("Menghapus cache soal AI...")
        db.table("soal").delete().eq("sumber", "ai").execute()
        
        print("\n✅ SELESAI! Database kembali bersih.")
        print("Data Siswa dan Soal Manual TETAP AMAN.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()
