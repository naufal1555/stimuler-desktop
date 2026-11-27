import os
import time
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load .env variables (e.g. GEMINI_API_KEY)
load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("stimuler.main")

from api.container import container
from api.routers import (
    conversation_router,
    catalog_router,
    media_router,
    settings_router
)

PORT = int(os.environ.get("STIMULER_PORT", 8765))

def prune_audio_cache(cache_dir: Path, max_age_hours: float = 2.0, max_size_mb: float = 150.0) -> None:
    """Safely prunes stale temporary audio recordings to protect user disk space."""
    try:
        now = time.time()
        max_age_seconds = max_age_hours * 3600
        audio_files = [
            f for f in cache_dir.iterdir()
            if f.is_file() and f.name != ".gitkeep" and f.suffix.lower() in (".webm", ".mp3", ".wav")
        ]

        pruned_count = 0
        for f in audio_files:
            try:
                if (now - f.stat().st_mtime) > max_age_seconds:
                    f.unlink(missing_ok=True)
                    pruned_count += 1
            except Exception:
                pass

        # Check total directory size and prune oldest if necessary (LRU)
        remaining = [
            f for f in cache_dir.iterdir()
            if f.is_file() and f.name != ".gitkeep" and f.suffix.lower() in (".webm", ".mp3", ".wav")
        ]
        total_size_mb = sum(f.stat().st_size for f in remaining) / (1024 * 1024)
        if total_size_mb > max_size_mb:
            remaining.sort(key=lambda x: x.stat().st_mtime)
            while total_size_mb > max_size_mb and remaining:
                oldest = remaining.pop(0)
                sz = oldest.stat().st_size / (1024 * 1024)
                oldest.unlink(missing_ok=True)
                total_size_mb -= sz
                pruned_count += 1

        if pruned_count > 0:
            logger.info("Audio cache maintenance: pruned %d stale audio recordings.", pruned_count)
    except Exception as e:
        logger.warning("Audio cache pruning non-fatal error: %s", e)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Stimuler Hexagonal Backend on port %s...", PORT)
    # 1. Clean audio cache on startup
    prune_audio_cache(container.audio_cache_dir)

    # 2. Pre-warming Faster-Whisper model on background startup
    try:
        logger.info("Pre-warming Whisper STT model ('small.en')...")
        _ = container.whisper_adapter.model
        logger.info("Whisper STT model pre-warmed successfully!")
    except Exception as e:
        logger.error("Whisper pre-warm encountered non-fatal error: %s", e)
    yield
    logger.info("Shutting down Stimuler Backend...")

app = FastAPI(
    title="Stimuler PC Desktop Dedicated AI Engine",
    description="Hexagonal Architecture backend for Stimuler AI Speaking Coach",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for desktop Electron app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount audio cache for playback
app.mount("/audio_cache", StaticFiles(directory=str(container.audio_cache_dir)), name="audio_cache")

# Mount Routers
app.include_router(conversation_router)
app.include_router(catalog_router)
app.include_router(media_router)
app.include_router(settings_router)

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "engine": "Stimuler Hexagonal Clean Architecture Backend",
        "version": "2.1.0",
        "port": PORT
    }

@app.get("/api/diagnostics")
def diagnostics():
    """Returns deep subsystem diagnostic metrics without exposing secrets."""
    cache_files = [f for f in container.audio_cache_dir.iterdir() if f.is_file() and f.name != ".gitkeep"]
    cache_size_mb = round(sum(f.stat().st_size for f in cache_files) / (1024 * 1024), 2)
    
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    has_gemini = bool(gemini_key and not gemini_key.startswith("AIzaSyFake"))

    return {
        "status": "healthy",
        "engine": "Stimuler Hexagonal Clean Architecture Backend",
        "version": "2.1.0",
        "whisper": {
            "model": "small.en",
            "quantization": "int8",
            "status": "ready"
        },
        "audio_cache": {
            "file_count": len(cache_files),
            "size_mb": cache_size_mb
        },
        "ai_providers": {
            "gemini_cloud_configured": has_gemini,
            "offline_brain_ready": True
        },
        "tts_engine": "Microsoft Edge-TTS Neural Voice (en-US-JennyNeural)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=PORT, reload=False)
