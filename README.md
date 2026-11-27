# Stimuler AI - Desktop PC Application & AI Speaking Coach

[![CI Pipeline](https://github.com/naufal1555/stimuler-desktop/actions/workflows/ci.yml/badge.svg)](https://github.com/naufal1555/stimuler-desktop/actions/workflows/ci.yml)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Release: v2.1](https://img.shields.io/badge/Release-v2.1--Enhanced-blueviolet)
![UI: iPhone 18 Pro Max Frame](https://img.shields.io/badge/UI-iPhone%2018%20Pro%20Max%20Finishes-black)
![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue)
![Electron](https://img.shields.io/badge/Electron-35.0-47848F)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)

A high-performance PC desktop replica of **Stimuler** (AI English Speaking & Fluency Coach), engineered with **Hexagonal Architecture (Ports & Adapters / Clean Architecture)**, native microphone streaming, low-latency Speech-to-Text, acoustic phoneme scoring, and multi-turn conversational AI coaching.

---

## What's New in v2.1 (Shadowing Mode, Voice Speed & Diagnostics)

Stimuler Desktop v2.1 brings pedagogical shadowing drills, voice speed controls, deep engine diagnostics, and multi-finish hardware styling:

- **Sentence Shadowing Mode (Pronunciation Drill):**
  - Switch between isolated word phonemes and full-sentence shadowing drills with native audio modeling.
  - Real-time Speech-to-Text token alignment with color-coded accuracy indicators and Words-Per-Minute (WPM) cadence scoring.

- **Dynamic Voice Playback Speed Controller:**
  - Fine-tune Sarah's speech playback rate on the fly (`0.75x` for careful listening, `1.0x` for natural rhythm, `1.25x` for brisk native cadence) directly in the conversation header without pitch distortion.

- **iPhone 18 Pro Max Titanium Finish Selector:**
  - Cycle dynamically between **Natural Titanium**, **Space Black**, and **Desert Titanium** finishes with reactive chassis gradients and hardware button highlights.
  - Interactive **Dynamic Island Live Activities** displaying real-time speaker waveforms and recording states.

- **Subsystem Diagnostics Endpoint (`/api/diagnostics`):**
  - Comprehensive health auditing covering Whisper model quantization status, audio cache footprint, and AI provider connectivity.

---

## Features & Core Capabilities (v2.0 Highlights)

- **Flagship Dual-View Switcher (iPhone 18 Pro Max Frame vs Desktop Expanded):**
  - Toggle seamlessly between a full-width desktop workstation and an authentic **iPhone 18 Pro Max (Natural Titanium)** 19.5:9 OLED device frame.
  - Interactive **Dynamic Island Live Activities**:
    - **Speech Waveform:** Dynamically expands with jumping audio bars while Sarah speaks.
    - **Recording Countdown:** Displays a pulsing red `REC` indicator with live timer during user speech.
  - Tactile Action Button, volume rockers, power key, laser-etched speaker slit, and iOS home bar.

- **Word-by-Word Acoustic Pronunciation Heatmap:**
  - Token-level acoustic confidence mapping powered by Faster-Whisper:
    - **Green (`>= 85%`):** Accurate, fluent native-level articulation.
    - **Amber (`65% - 85%`):** Slight hesitation or minor phoneme imperfection.
    - **Coral/Red (`< 65%`):** Mispronounced or phonetic anomaly.
  - **Click-to-Listen:** Click any spoken word to hear Sarah's model pronunciation instantly with acoustic accuracy scores.

- **Custom Scenario & Roleplay Generator:**
  - Create unlimited roleplay situations beyond static catalogs (e.g. *Google Technical Interview*, *Salary Negotiation*, *Academic Thesis Defense*).
  - Dynamically primes Sarah's persona, evaluation criteria, and conversational tone.

- **Audio Input Device Selector:**
  - Enumerate and choose physical microphone devices (headset, external USB mic, or laptop mic) directly in Settings via `navigator.mediaDevices.enumerateDevices()`.

- **Comprehensive Session Report Exporter:**
  - One-click export to formatted Markdown (`.md`) or Print to PDF containing IELTS Band breakdown, full transcript, grammar fixes, and pronunciation drills.

- **Real-Time 24-Band FFT Audio Frequency Visualizer:**
  - Web Audio API `AudioContext` and `AnalyserNode` generating fluid jumping equalizer bars during microphone recording.

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
│   │   ├── components/         # ChatRoom, TopicCatalog, IPhone18ProFrame, MistakesDrawer, Drills
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
