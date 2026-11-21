# Stimuler AI - Desktop PC Application & AI Speaking Coach

[![CI Pipeline](https://github.com/naufal1555/stimuler-desktop/actions/workflows/ci.yml/badge.svg)](https://github.com/naufal1555/stimuler-desktop/actions/workflows/ci.yml)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue)
![Electron](https://img.shields.io/badge/Electron-35.0-47848F)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)

A high-performance PC desktop replica of **Stimuler** (AI English Speaking & Fluency Coach), engineered with **Hexagonal Architecture (Ports & Adapters / Clean Architecture)**, native microphone streaming, low-latency Speech-to-Text, acoustic phoneme scoring, and multi-turn conversational AI coaching.

---

## Architecture Overview (Hexagonal / Clean Architecture)

The system is decoupled into strict concentric architectural layers following Domain-Driven Design (DDD) principles:

```
+-----------------------------------------------------------------------------------+
|                                API / DELIVERY LAYER                               |
|   FastAPI REST API  *  CORS Middleware  *  Static Media  *  Electron Desktop IPC  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  USE CASES LAYER                                  |
|   TranscribeSpeech  *  EvaluateConversation  *  EvaluatePronunciation  *  TTS    |
+-----------------------------------------------------------------------------------+
                   |                                              |
                   v                                              v
+--------------------------------------+      +-------------------------------------+
|             PORTS LAYER              |      |            DOMAIN LAYER             |
|   ISTTEngine       *  ILLMCoach      |      |   TurnAnalysis    *  UserProfile    |
|   ITTSEngine       *  ITranslator    | <--- |   SessionRecord   *  MistakeRecord  |
|   IUserRepository  *  ISessionRepo   |      |   Transcription   *  Pronunciation  |
+--------------------------------------+      +-------------------------------------+
                   ^
                   | (implements)
+-----------------------------------------------------------------------------------+
|                                  ADAPTERS LAYER                                   |
|  * STT Adapter: Faster-Whisper (small.en, int8, greedy beam=1, hotwords biasing)  |
|  * Audio Decoder: PyAV 16kHz mono resampler + peak normalizer + silence gating    |
|  * LLM Coach: Google Gemini (3.8-Flash / Flash-Lite) with strict grounding        |
|  * Fallback Coach: Dynamic Context Offline Dialogue Engine (zero canned templates)|
|  * TTS Engine: Microsoft Edge-TTS Neural Voice (en-US-JennyNeural)                |
|  * Translation: Google Translate RPC Adapter                                      |
|  * Persistence: Local SQLite Repository (WAL mode)                                |
+-----------------------------------------------------------------------------------+
```

### Core Design Highlights:
- **Dependency Inversion Principle (DIP):** Domain entities and business use cases have zero external dependencies on frameworks, databases, or AI vendor SDKs.
- **Dependency Injection Container (`api/container.py`):** Instantiates singletons and binds concrete adapters to abstract protocols with zero circular imports.
- **Composite Fallback Pattern:** The conversational coach transparently cascades from Google Gemini Flash to the offline contextual brain when offline.
- **Test-Driven Architecture:** Complete automated test suite (`pytest`) verifying domain immutability, isolated use cases via mock ports, and integration HTTP endpoints.

---

## Key Features

1. **Native Desktop Experience (Electron 35 + React 18):**
   - Standalone desktop application with zero browser pop-ups and direct hardware microphone access.
   - Built with Vite, TypeScript, and Tailwind CSS.
   - Non-blocking in-app notification and toast system replacing intrusive browser alerts.
   - Periodic heartbeat monitor (`/api/health`) with live connection state indicator.

2. **Accurate Speech-to-Text & Silence Diagnostics:**
   - Powered by Faster-Whisper `small.en` (244M parameters) with `int8` CPU quantization.
   - Automatic volume peak normalization (0.95 scaling) for quiet desktop microphones.
   - Silence gating and RMS thresholding to prevent phantom audio hallucinations.
   - Domain-targeted hotwords biasing (`Claude`, `ChatGPT`, `Stimuler`, `IELTS`, `pronunciation`).

3. **Real Acoustic Pronunciation & Syllable Scoring:**
   - Replaces random or mock scores with token-level acoustic confidence probabilities from Whisper.
   - Syllable-level phonetic breakdown with stress mark emphasis (e.g. `kuhn • TAY • juhs` for *contagious*).
   - Real-time articulation feedback with IPA phonetic representations.

4. **Zero-Hallucination AI Coach (Sarah):**
   - Strictly grounded conversational prompt adhering only to explicit dialogue context.
   - Natural 2-3 sentence turn-taking with engaging follow-up questions.
   - Dynamic IELTS Band (4.5 - 9.0) and CEFR proficiency scoring.
   - Real-time grammar error highlighting and native vocabulary suggestions.

5. **Audio Cache Maintenance & Disk Safety:**
   - Automatic LRU / TTL pruning routine running on startup and turn execution.
   - Stale temporary audio files older than 2 hours are pruned automatically to protect disk space.

6. **100% Unlocked Educational Content:**
   - Free access to conversation topics, lessons, and practice roadmaps with zero paywalls.

---

## Project Structure

```
stimuler-desktop/
├── .github/workflows/          # GitHub Actions CI/CD workflows
│   └── ci.yml                  # Automated Pytest suite and Vite build pipeline
│
├── app/                        # Frontend Desktop Client (React 18 + Vite + TS + Electron)
│   ├── electron/               # Electron main & preload scripts
│   ├── src/
│   │   ├── components/         # ChatRoom, TopicCatalog, MistakesDrawer, PronunciationDrill
│   │   ├── services/           # API client and Web Audio recording services
│   │   └── types/              # TypeScript interface definitions
│   └── package.json
│
├── backend/                    # Dedicated Python AI Engine (Port 8765)
│   ├── domain/                 # Pure entities and value objects
│   ├── ports/                  # Protocol abstractions (STT, LLM, TTS, Repository)
│   ├── adapters/               # Concrete adapters (Faster-Whisper, Gemini, Edge-TTS, SQLite)
│   ├── use_cases/              # Orchestrated business workflows
│   ├── api/                    # Dependency injection container and FastAPI routes
│   ├── tests/                  # Automated Pytest test suite (Unit & Integration)
│   │   ├── unit/               # Domain & Use Case unit tests
│   │   └── integration/        # HTTP API endpoint tests
│   ├── main.py                 # FastAPI application entrypoint with lifespan pre-warming
│   ├── app.py                  # CLI launcher facade
│   └── .env.example            # Environment configuration template
│
├── extracted_assets/           # Mock catalogs, Lottie animations, and static media
├── run_stimuler.bat            # One-click Windows application launcher
└── README.md
```

---

## Getting Started

### Prerequisites
- Windows 10/11
- Python 3.10+
- Node.js 18+

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/naufal1555/stimuler-desktop.git
   cd stimuler-desktop
   ```

2. **Configure Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   copy .env.example .env
   # Add your optional Gemini API key to .env if you wish to use online mode:
   # GEMINI_API_KEY=your_key_here
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../app
   npm install
   ```

4. **Run Automated Tests:**
   ```bash
   cd ../backend
   pytest -v
   ```

5. **Run the Application:**
   From the repository root, double-click or run:
   ```cmd
   run_stimuler.bat
   ```
   This starts the dedicated AI backend on port `8765` and opens the native Electron desktop application.

---

## Security & Privacy

- **Zero Credential Exposure:** `.env`, API keys, database records, and cached audio files are excluded from version control via `.gitignore`.
- **Local-First Architecture:** Speech transcription and offline coaching run 100% locally on your CPU with no mandatory cloud connection.

---

## License

MIT License. Educational and portfolio reverse-engineering project. All trademarks and brand assets belong to their respective owners.
