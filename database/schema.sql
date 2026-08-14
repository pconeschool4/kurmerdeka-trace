-- ============================================================
-- KURMERDEKA-TRACE — Schema PostgreSQL (Supabase)
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Tabel siswa ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS siswa (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nama  TEXT NOT NULL,
    kelas TEXT NOT NULL
);

-- ── Tabel soal (manual + AI cache) ───────────────────────────
CREATE TABLE IF NOT EXISTS soal (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bab        TEXT NOT NULL,
    cp         TEXT NOT NULL,
    subbab     TEXT NOT NULL,
    soal       TEXT NOT NULL,
    pilihan    JSONB NOT NULL,          -- ["A. ...", "B. ...", ...]
    jawaban    TEXT NOT NULL,           -- "A" | "B" | "C" | "D"
    penjelasan TEXT DEFAULT '',
    sumber     TEXT NOT NULL DEFAULT 'manual'  -- 'manual' | 'ai'
);

-- ── Tabel jawaban_siswa ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS jawaban_siswa (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    siswa_id  BIGINT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    soal_id   BIGINT NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
    jawaban   TEXT NOT NULL,
    benar     BOOLEAN NOT NULL DEFAULT FALSE,
    waktu     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabel skor_cp ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skor_cp (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    siswa_id    BIGINT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    cp          TEXT NOT NULL,
    total_soal  INTEGER NOT NULL DEFAULT 0,
    benar       INTEGER NOT NULL DEFAULT 0,
    persentase  NUMERIC(5,1) NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'merah',  -- 'hijau' | 'kuning' | 'merah'
    UNIQUE (siswa_id, cp)
);

-- ── Tabel weak_spot ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weak_spot (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    siswa_id     BIGINT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    subbab       TEXT NOT NULL,
    total_salah  INTEGER NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'perlu_latihan',  -- 'perlu_latihan' | 'kritis'
    UNIQUE (siswa_id, subbab)
);

-- ── Indexes untuk performa ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jawaban_siswa_id  ON jawaban_siswa(siswa_id);
CREATE INDEX IF NOT EXISTS idx_skor_cp_siswa     ON skor_cp(siswa_id);
CREATE INDEX IF NOT EXISTS idx_weak_spot_siswa   ON weak_spot(siswa_id);
CREATE INDEX IF NOT EXISTS idx_soal_sumber       ON soal(sumber);
CREATE INDEX IF NOT EXISTS idx_soal_subbab       ON soal(subbab);

-- ── Row Level Security (opsional, aktifkan untuk produksi) ────
-- ALTER TABLE siswa        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE soal         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jawaban_siswa ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE skor_cp      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE weak_spot    ENABLE ROW LEVEL SECURITY;
