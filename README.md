# Stimuler AI - Desktop PC Application & AI Speaking Coach

A high-performance PC desktop replica of **Stimuler** (AI English Speaking & Fluency Coach), engineered with **Hexagonal Architecture (Ports & Adapters / Clean Architecture)**, native microphone streaming, low-latency Speech-to-Text, and multi-turn conversational AI coaching.

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
|   TranscribeSpeech  *  EvaluateConversation  *  SynthesizeVoice  *  CatalogQueries|
+-----------------------------------------------------------------------------------+
                   |                                              |
                   v                                              v
+--------------------------------------+      +-------------------------------------+
|             PORTS LAYER              |      |            DOMAIN LAYER             |
|   ISTTEngine       *  ILLMCoach      |      |   TurnAnalysis    *  UserProfile    |
|   ITTSEngine       *  ITranslator    | <--- |   SessionRecord   *  MistakeRecord  |
|   IUserRepository  *  ISessionRepo   |      |   Transcription   *  AudioDiag      |
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

---

## Key Features

1. **Native Desktop Experience (Electron 35 + React 18):**
   - Standalone desktop application with zero browser pop-ups and direct hardware microphone access.
   - Built with Vite, TypeScript, and Tailwind CSS.

2. **Accurate Speech-to-Text & Diagnostics:**
   - Powered by Faster-Whisper `small.en` (244M parameters) with `int8` CPU quantization.
   - Automatic volume peak normalization (0.95 scaling) for quiet desktop microphones.
   - Silence gating and RMS thresholding to prevent phantom audio hallucinations.
   - Domain-targeted hotwords biasing (`Claude`, `ChatGPT`, `Stimuler`, `IELTS`, `pronunciation`).

3. **Zero-Hallucination AI Coach (Sarah):**
   - Strictly grounded conversational prompt adhering only to explicit dialogue context.
   - Natural 2-3 sentence turn-taking with engaging follow-up questions.
   - Dynamic IELTS Band (4.5 - 9.0) and CEFR proficiency scoring.
   - Real-time grammar error highlighting and native vocabulary suggestions.

4. **Authentic UI & Multimedia Reproduction:**
   - Lottie vector animations for daily streaks, pulsing mic, and celebration badges.
   - Syllable-level phoneme breakdown with phonetic IPA stress marks.
   - Natural neural voice synthesis via Microsoft Edge-TTS.

5. **100% Unlocked Educational Content:**
   - Free access to conversation topics, lessons, and practice roadmaps with zero paywalls.

---

## Project Structure

```
d:/REA Stimuler/
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
   pip install -r requirements.txt # Or install: fastapi uvicorn faster-whisper av edge-tts httpx google-genai
   copy .env.example .env
   # Add your optional Gemini API key to .env if you wish to use online mode:
   # GEMINI_API_KEY=your_key_here
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../app
   npm install
   ```

4. **Run the Application:**
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
