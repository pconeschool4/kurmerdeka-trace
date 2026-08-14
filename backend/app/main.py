"""
Main FastAPI application — KURMERDEKA-TRACE Backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import quiz, student, dashboard, generate

app = FastAPI(
    title="KURMERDEKA-TRACE API",
    description="Adaptive Quiz Platform — Tracking & Remedial Otomatis per CP/TP",
    version="1.0.0",
)

# CORS — izinkan frontend Next.js (localhost:3000) dan Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daftarkan semua router
app.include_router(quiz.router)
app.include_router(student.router)
app.include_router(dashboard.router)
app.include_router(generate.router)


@app.get("/", tags=["health"])
def root():
    return {
        "status": "ok",
        "app": "KURMERDEKA-TRACE API",
        "version": "1.0.0",
        "endpoints": [
            "POST /api/quiz/submit",
            "GET  /api/student/{siswa_id}",
            "GET  /api/dashboard/guru",
            "POST /api/generate-soal",
        ],
    }


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
