import os
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Stimuler Hexagonal Backend on port %s...", PORT)
    # Pre-warming Faster-Whisper model on background startup
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
        "version": "2.0.0",
        "port": PORT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=PORT, reload=False)
