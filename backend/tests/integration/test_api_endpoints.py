import pytest
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

from main import app
from httpx import AsyncClient, ASGITransport

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "Hexagonal" in data["engine"]

@pytest.mark.asyncio
async def test_diagnostics_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/diagnostics")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "2.1.0"
        assert "whisper" in data
        assert data["whisper"]["status"] == "ready"
        assert "audio_cache" in data
        assert "ai_providers" in data

        # Clear cache test
        clear_res = await client.post("/api/diagnostics/cache/clear")
        assert clear_res.status_code == 200
        assert clear_res.json()["status"] == "success"

@pytest.mark.asyncio
async def test_catalog_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Topics
        r_topics = await client.get("/api/topics")
        assert r_topics.status_code == 200
        assert "data" in r_topics.json()

        # Courses
        r_courses = await client.get("/api/courses")
        assert r_courses.status_code == 200
        assert "data" in r_courses.json()

        # Default Analysis
        r_analysis = await client.get("/api/analysis/default")
        assert r_analysis.status_code == 200

@pytest.mark.asyncio
async def test_settings_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Save key
        r_save = await client.post("/api/settings/apikey", json={"api_key": "test_api_key_123456789"})
        assert r_save.status_code == 200
        assert r_save.json()["status"] == "success"

        # Read status
        r_get = await client.get("/api/settings/apikey")
        assert r_get.status_code == 200
        assert r_get.json()["has_key"] is True

@pytest.mark.asyncio
async def test_evaluate_turn_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "user_speech": "I really enjoy learning English every day.",
            "topic_title": "Daily Routine",
            "conversation_history": []
        }
        response = await client.post("/api/evaluate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "reply_text" in data["data"]
        assert "overall_score" in data["data"]
        assert "ielts_band" in data["data"]

@pytest.mark.asyncio
async def test_pronunciation_score_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "target_word": "thorough",
            "transcribed_text": "thorough",
            "words": [{"word": "thorough", "start": 0.0, "end": 0.5, "probability": 0.95}],
            "syllables": ["thur", "oh"],
            "stressed_index": 0
        }
        response = await client.post("/api/pronunciation/score", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["data"]["score"] >= 88
        assert data["data"]["is_correct"] is True
        assert len(data["data"]["syllables"]) == 2
