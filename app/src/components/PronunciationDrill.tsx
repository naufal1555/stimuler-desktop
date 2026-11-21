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

export const PronunciationDrill: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [frequencyBands, setFrequencyBands] = useState<number[]>(Array(16).fill(12))
  const [drillScore, setDrillScore] = useState<number | null>(null)
  const [drillFeedback, setDrillFeedback] = useState<string | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const activeDrill = DEFAULT_DRILLS[currentIndex]

  const handlePlayReference = async () => {
    try {
      const res = await api.getTTS(activeDrill.word)
      audioService.playAudio(res.audio_url)
    } catch (e) {
      console.warn('TTS failed:', e)
    }
  }

  const handleStartDrillRecord = async () => {
    try {
      setDrillScore(null)
      setDrillFeedback(null)
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

  const handleStopDrillRecord = async () => {
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F7F6FF] p-8 max-w-2xl mx-auto justify-center items-center">
      <div className="w-full bg-white rounded-3xl p-8 border border-[#E8E5F8] shadow-xl text-center relative overflow-hidden">
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

        {/* Real Acoustic Score Meter */}
        {drillScore !== null && (
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
          {isRecording ? 'Listening... Tap checkmark to grade' : isEvaluating ? 'Analyzing acoustic phonemes...' : 'Tap microphone to speak'}
        </div>

        {/* Navigation Next / Prev */}
        <div className="flex justify-between items-center pt-4 border-t border-[#F7F6FF]">
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
        </div>
      </div>
    </div>
  )
}
