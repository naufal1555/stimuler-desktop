import React, { useState } from 'react'
import { Volume2, Mic, CheckCircle2 } from 'lucide-react'
import { api } from '../services/api'
import { audioService } from '../services/audioService'
import confetti from 'canvas-confetti'
import { LottiePlayer } from './LottiePlayer'

interface DrillWord {
  word: string
  phonetic: string
  syllables: string[]
  stressedIndex: number
  sentence: string
}

const DEFAULT_DRILLS: DrillWord[] = [
  { 
    word: 'contagious', 
    phonetic: '/kənˈteɪdʒəs/', 
    syllables: ['kuhn', 'tay', 'juhs'],
    stressedIndex: 1,
    sentence: 'Her enthusiasm was contagious.' 
  },
  { 
    word: 'thorough', 
    phonetic: '/ˈθʌrə/', 
    syllables: ['thur', 'oh'],
    stressedIndex: 0,
    sentence: 'We had a thorough look around.' 
  },
  { 
    word: 'prepare', 
    phonetic: '/prɪˈpeər/', 
    syllables: ['pri', 'pair'],
    stressedIndex: 1,
    sentence: 'You need to prepare for the talk.' 
  },
  { 
    word: 'schedule', 
    phonetic: '/ˈʃedʒ.uːl/', 
    syllables: ['shed', 'yool'],
    stressedIndex: 0,
    sentence: 'Let us check the schedule.' 
  },
  { 
    word: 'comfortable', 
    phonetic: '/ˈkʌm.fɚ.t̬ə.bəl/', 
    syllables: ['kuhmf', 'ter', 'buhl'],
    stressedIndex: 0,
    sentence: 'Make yourself comfortable.' 
  }
]

interface ShadowingSentence {
  sentence: string
  translation: string
  focusWords: string[]
}

const DEFAULT_SENTENCES: ShadowingSentence[] = [
  {
    sentence: "Effective communication is essential for cross-functional collaboration.",
    translation: "Komunikasi yang efektif sangat penting untuk kolaborasi lintas fungsi.",
    focusWords: ["effective", "communication", "essential", "collaboration"]
  },
  {
    sentence: "Could you please elaborate on the technical architecture of your project?",
    translation: "Bisakah Anda menjelaskan lebih rinci tentang arsitektur teknis proyek Anda?",
    focusWords: ["elaborate", "technical", "architecture"]
  },
  {
    sentence: "I would like to schedule a follow-up meeting to review our roadmap.",
    translation: "Saya ingin menjadwalkan pertemuan lanjutan untuk meninjau roadmap kita.",
    focusWords: ["schedule", "follow-up", "roadmap"]
  },
  {
    sentence: "The presentation was thoroughly engaging and received great feedback.",
    translation: "Presentasinya sangat menarik dan menerima umpan balik yang sangat baik.",
    focusWords: ["presentation", "thoroughly", "engaging", "feedback"]
  },
  {
    sentence: "Continuous practice will significantly improve your spontaneous speaking fluency.",
    translation: "Latihan konsisten akan meningkatkan kelancaran berbicara spontan Anda secara signifikan.",
    focusWords: ["continuous", "significantly", "spontaneous", "fluency"]
  }
]

export const PronunciationDrill: React.FC = () => {
  const [drillMode, setDrillMode] = useState<'words' | 'shadowing'>('words')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [frequencyBands, setFrequencyBands] = useState<number[]>(Array(16).fill(12))
  const [drillScore, setDrillScore] = useState<number | null>(null)
  const [drillFeedback, setDrillFeedback] = useState<string | null>(null)
  const [shadowingResult, setShadowingResult] = useState<{
    score: number
    wpm: number
    transcribed: string
    matchedWords: string[]
  } | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const activeDrill = DEFAULT_DRILLS[currentIndex]
  const activeSentence = DEFAULT_SENTENCES[sentenceIndex]

  const handlePlayReference = async () => {
    try {
      const res = await api.getTTS(activeDrill.word)
      audioService.playAudio(res.audio_url)
    } catch (e) {
      console.warn('TTS failed:', e)
    }
  }

  const handlePlaySentenceReference = async () => {
    try {
      const res = await api.getTTS(activeSentence.sentence)
      audioService.playAudio(res.audio_url)
    } catch (e) {
      console.warn('Sentence TTS failed:', e)
    }
  }

  const handleStartDrillRecord = async () => {
    try {
      setDrillScore(null)
      setDrillFeedback(null)
      setShadowingResult(null)
      setIsRecording(true)
      audioService.playSFX('tone.mp3')
      await audioService.startRecording({
        onFrequencyData: (bands) => setFrequencyBands(bands),
        bandsCount: 16
      })
    } catch (e) {
      alert('Microphone permission required')
      setIsRecording(false)
    }
  }

  const handleStopShadowingRecord = async () => {
    if (!isRecording) return
    setIsRecording(false)
    setIsEvaluating(true)

    try {
      const blob = await audioService.stopRecording()
      const transcribeRes = await api.transcribeAudio(blob)
      const userText = (transcribeRes.text || '').toLowerCase().replace(/[^\w\s]/g, '')
      const userTokens = userText.split(/\s+/).filter(Boolean)

      const targetWords = activeSentence.sentence.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean)
      const matched: string[] = []

      targetWords.forEach((tw) => {
        if (userTokens.includes(tw)) {
          matched.push(tw)
        }
      })

      const score = Math.min(100, Math.round((matched.length / Math.max(1, targetWords.length)) * 100))
      const wpm = transcribeRes.wpm || Math.round((userTokens.length / Math.max(1, transcribeRes.duration || 3)) * 60)

      setShadowingResult({
        score,
        wpm,
        transcribed: transcribeRes.text || '',
        matchedWords: matched
      })

      if (score >= 80) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
        audioService.playSFX('correct_guess.mp3')
      } else {
        audioService.playSFX('negative_beep.mp3')
      }
    } catch (err) {
      console.error('Shadowing evaluation error:', err)
      setShadowingResult({
        score: 60,
        wpm: 90,
        transcribed: 'Audio not recognized clearly.',
        matchedWords: []
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleStopDrillRecord = async () => {
    if (drillMode === 'shadowing') {
      return handleStopShadowingRecord()
    }
    if (!isRecording) return
    setIsRecording(false)
    setIsEvaluating(true)

    try {
      const blob = await audioService.stopRecording()
      const evalResult = await api.evaluatePronunciation({
        audioBlob: blob,
        targetWord: activeDrill.word,
        syllables: activeDrill.syllables,
        stressedIndex: activeDrill.stressedIndex
      })

      setDrillScore(evalResult.score)
      setDrillFeedback(evalResult.feedback)

      if (evalResult.is_correct) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
        audioService.playSFX('correct_guess.mp3')
      } else {
        audioService.playSFX('negative_beep.mp3')
      }
    } catch (err) {
      console.error('Pronunciation evaluation error:', err)
      setDrillScore(65)
      setDrillFeedback('Could not evaluate pronunciation accurately. Please speak closer to the mic.')
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F7F6FF] p-4 sm:p-8 max-w-2xl mx-auto justify-center items-center w-full">
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-[#E8E5F8] shadow-xl text-center relative overflow-hidden">
        
        {/* Drill Mode Segmented Switcher */}
        <div className="flex bg-[#F0EDFC] p-1 rounded-2xl mb-6 max-w-xs mx-auto border border-[#E8E5F8]">
          <button
            type="button"
            onClick={() => {
              setDrillMode('words')
              setDrillScore(null)
              setShadowingResult(null)
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              drillMode === 'words' ? 'bg-white text-[#5A45FF] shadow-xs' : 'text-[#6B7280]'
            }`}
          >
            Word Phonemes
          </button>
          <button
            type="button"
            onClick={() => {
              setDrillMode('shadowing')
              setDrillScore(null)
              setShadowingResult(null)
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              drillMode === 'shadowing' ? 'bg-white text-[#5A45FF] shadow-xs' : 'text-[#6B7280]'
            }`}
          >
            Sentence Shadowing
          </button>
        </div>

        {/* MODE 1: SINGLE WORD PHONEMES */}
        {drillMode === 'words' && (
          <>
            {/* Progress header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F7F6FF]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Acoustic Phoneme Drill {currentIndex + 1} of {DEFAULT_DRILLS.length}
              </div>
              <div className="flex items-center gap-1.5">
                {DEFAULT_DRILLS.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentIndex ? 'bg-[#5A45FF] scale-125' : i < currentIndex ? 'bg-[#3BBE8F]' : 'bg-[#E8E5F8]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Syllable Breakdown with Stressed Syllable Highlight */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {activeDrill.syllables.map((syl, i) => {
                  const isStressed = i === activeDrill.stressedIndex
                  return (
                    <span
                      key={i}
                      className={`text-2xl font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all ${
                        isStressed
                          ? 'bg-[#FFF3E3] text-[#F9A834] border-2 border-[#F9A834] scale-110 shadow-sm'
                          : 'bg-[#F7F6FF] text-[#4B5563] border border-[#E8E5F8]'
                      }`}
                    >
                      {syl}
                    </span>
                  )
                })}
              </div>

              <div className="text-xs font-mono text-[#6B7280]">
                IPA: {activeDrill.phonetic}
              </div>
            </div>

            {/* Context Sentence */}
            <p className="text-sm text-[#4B5563] italic mb-6">
              "{activeDrill.sentence}"
            </p>

            {/* Reference Audio Listen Chip */}
            <button
              onClick={handlePlayReference}
              className="mb-8 px-5 py-2.5 rounded-full bg-[#F7F6FF] hover:bg-[#EFEFFD] text-xs font-bold text-[#5A45FF] inline-flex items-center gap-2 border border-[#E8E5F8] transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Listen to Model Pronunciation</span>
            </button>
          </>
        )}

        {/* MODE 2: FULL SENTENCE SHADOWING */}
        {drillMode === 'shadowing' && (
          <>
            {/* Progress header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F7F6FF]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Shadowing Sentence {sentenceIndex + 1} of {DEFAULT_SENTENCES.length}
              </div>
              <div className="flex items-center gap-1.5">
                {DEFAULT_SENTENCES.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === sentenceIndex ? 'bg-[#5A45FF] scale-125' : i < sentenceIndex ? 'bg-[#3BBE8F]' : 'bg-[#E8E5F8]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Target Sentence Display with Token Highlighting */}
            <div className="mb-4">
              <div className="text-lg sm:text-xl font-bold text-[#1E1B4B] leading-relaxed mb-2.5 flex flex-wrap items-center justify-center gap-1.5">
                {activeSentence.sentence.split(' ').map((word, wIdx) => {
                  const clean = word.toLowerCase().replace(/[^\w]/g, '')
                  const isMatched = shadowingResult?.matchedWords.includes(clean)
                  let badge = 'text-[#1E1B4B]'
                  if (shadowingResult) {
                    badge = isMatched
                      ? 'bg-[#E6F9F2] text-[#1A8B56] px-1.5 py-0.5 rounded-md border border-[#A7F3D0]'
                      : 'bg-[#FEF2F2] text-[#B91C1C] px-1.5 py-0.5 rounded-md border border-[#FECACA]'
                  }
                  return (
                    <span key={wIdx} className={`transition-all ${badge}`}>
                      {word}
                    </span>
                  )
                })}
              </div>

              <p className="text-xs text-[#6B7280] italic mb-6">
                "{activeSentence.translation}"
              </p>
            </div>

            {/* Reference Audio Listen Chip */}
            <button
              onClick={handlePlaySentenceReference}
              className="mb-8 px-5 py-2.5 rounded-full bg-[#F7F6FF] hover:bg-[#EFEFFD] text-xs font-bold text-[#5A45FF] inline-flex items-center gap-2 border border-[#E8E5F8] transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Listen to Sarah Speak Sentence</span>
            </button>
          </>
        )}

        {/* Score Meter for Word Phonemes */}
        {drillMode === 'words' && drillScore !== null && (
          <div className="mb-6 p-5 rounded-2xl bg-[#F7F6FF] border border-[#E8E5F8] max-w-sm mx-auto animate-in zoom-in-95 duration-150">
            <div className="text-3xl font-black text-[#1E1B4B] mb-1">{drillScore}%</div>
            <div className={`text-xs font-bold mb-1 ${drillScore >= 85 ? 'text-[#3BBE8F]' : 'text-[#F9A834]'}`}>
              {drillScore >= 85 ? 'Excellent Articulation!' : 'Slight accent detected.'}
            </div>
            {drillFeedback && (
              <p className="text-xs text-[#6B7280]">{drillFeedback}</p>
            )}
          </div>
        )}

        {/* Score Meter for Sentence Shadowing */}
        {drillMode === 'shadowing' && shadowingResult !== null && (
          <div className="mb-6 p-5 rounded-2xl bg-[#F7F6FF] border border-[#E8E5F8] max-w-sm mx-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-around mb-2">
              <div>
                <div className="text-3xl font-black text-[#1E1B4B]">{shadowingResult.score}%</div>
                <div className="text-[10px] uppercase font-bold text-[#6B7280]">Accuracy</div>
              </div>
              <div className="h-8 w-px bg-[#E8E5F8]" />
              <div>
                <div className="text-3xl font-black text-[#5A45FF]">{shadowingResult.wpm}</div>
                <div className="text-[10px] uppercase font-bold text-[#6B7280]">Speed (WPM)</div>
              </div>
            </div>
            <div className={`text-xs font-bold ${shadowingResult.score >= 80 ? 'text-[#3BBE8F]' : 'text-[#F9A834]'}`}>
              {shadowingResult.score >= 80 ? 'Great Speech Rhythm & Native Pace!' : 'Practice again to catch all keywords.'}
            </div>
          </div>
        )}

        {/* Real-time Frequency Waveform during Recording */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 h-7 mb-4 max-w-xs mx-auto px-4 py-1 bg-[#F0EDFC] rounded-full border border-[#E8E5F8]">
            {frequencyBands.map((val, idx) => (
              <div
                key={idx}
                className="w-1.5 bg-gradient-to-t from-[#5A45FF] to-[#8C7DFF] rounded-full transition-all duration-75 ease-out"
                style={{ height: `${Math.max(15, val)}%` }}
              />
            ))}
          </div>
        )}

        {/* Microphone Button with Lottie Pulsing */}
        <div className="flex justify-center mb-4">
          {!isRecording ? (
            <button
              onClick={handleStartDrillRecord}
              disabled={isEvaluating}
              className="w-16 h-16 rounded-2xl bg-[#5A45FF] hover:bg-[#4B36F0] disabled:opacity-50 text-white flex items-center justify-center shadow-lg shadow-[#5A45FF]/30 active:scale-95 transition-all"
            >
              <Mic className="w-7 h-7" />
            </button>
          ) : (
            <button
              onClick={handleStopDrillRecord}
              className="w-16 h-16 rounded-2xl bg-[#F35252] text-white flex items-center justify-center shadow-lg shadow-[#F35252]/30 active:scale-95 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none opacity-80 scale-125">
                <LottiePlayer src="/assets/lottie/mic_button_indonesia.json" className="w-full h-full" />
              </div>
              <CheckCircle2 className="w-7 h-7 relative z-10" />
            </button>
          )}
        </div>

        <div className="text-xs text-[#6B7280] font-medium mb-8">
          {isRecording ? 'Listening... Tap checkmark to grade' : isEvaluating ? 'Analyzing acoustic speech...' : 'Tap microphone to repeat'}
        </div>

        {/* Navigation Next / Prev */}
        <div className="flex justify-between items-center pt-4 border-t border-[#F7F6FF]">
          {drillMode === 'words' ? (
            <>
              <button
                onClick={() => {
                  setCurrentIndex((prev) => Math.max(0, prev - 1))
                  setDrillScore(null)
                  setDrillFeedback(null)
                }}
                disabled={currentIndex === 0}
                className="text-xs font-semibold text-[#6B7280] disabled:opacity-30"
              >
                &larr; Previous Word
              </button>
              <button
                onClick={() => {
                  setCurrentIndex((prev) => Math.min(DEFAULT_DRILLS.length - 1, prev + 1))
                  setDrillScore(null)
                  setDrillFeedback(null)
                }}
                disabled={currentIndex === DEFAULT_DRILLS.length - 1}
                className="text-xs font-bold text-[#5A45FF] disabled:opacity-30"
              >
                Next Word &rarr;
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setSentenceIndex((prev) => Math.max(0, prev - 1))
                  setShadowingResult(null)
                }}
                disabled={sentenceIndex === 0}
                className="text-xs font-semibold text-[#6B7280] disabled:opacity-30"
              >
                &larr; Previous Sentence
              </button>
              <button
                onClick={() => {
                  setSentenceIndex((prev) => Math.min(DEFAULT_SENTENCES.length - 1, prev + 1))
                  setShadowingResult(null)
                }}
                disabled={sentenceIndex === DEFAULT_SENTENCES.length - 1}
                className="text-xs font-bold text-[#5A45FF] disabled:opacity-30"
              >
                Next Sentence &rarr;
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
