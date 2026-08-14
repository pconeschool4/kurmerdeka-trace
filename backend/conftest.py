# conftest.py — shared fixtures
import os
import pytest

# Set dummy env vars untuk test agar pydantic-settings tidak error
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
