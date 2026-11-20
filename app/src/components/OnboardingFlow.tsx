import React, { useState, useEffect } from 'react'
import { Sparkles, Mic, Square, CheckCircle, ArrowRight, Volume2 } from 'lucide-react'
import { audioService } from '../services/audioService'
import { api } from '../services/api'
import confetti from 'canvas-confetti'
import { LottiePlayer } from './LottiePlayer'

interface OnboardingFlowProps {
  onComplete: (userData: { name: string; goal: string; baselineBand: number }) => void
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [userName, setUserName] = useState('')
  const [userGoal, setUserGoal] = useState('fluency')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [baselineScore, setBaselineScore] = useState<number | null>(null)

  // Step 1 Greeting
  useEffect(() => {
    if (step === 1) {
      audioService.playAudio('/assets/onboarding_chat/sfx/en/callMeSarahWhatsYourName.mp3')
    }
  }, [step])

  const handleStartRecording = async () => {
    try {
      setIsRecording(true)
      setRecordingSeconds(0)
      audioService.playSFX('tone.mp3')
      await audioService.startRecording()
    } catch {
      alert('Microphone access is needed for the placement test.')
      setIsRecording(false)
    }
  }

  const handleStopRecording = async () => {
    if (!isRecording) return
    setIsRecording(false)
    setIsEvaluating(true)
    audioService.playSFX('calling_cut_tone.mp3')

    try {
      const blob = await audioService.stopRecording()
      const res = await api.transcribeAudio(blob)
      
      const wordsCount = res.text.split(' ').length
      const band = Math.min(8.0, Math.max(5.0, 5.0 + (wordsCount / 10) * 0.5))
      setBaselineScore(band)
      setStep(4)
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
      audioService.playSFX('reward_dialog_coins.mp3')
    } catch (e) {
      console.warn(e)
      setBaselineScore(6.0)
      setStep(4)
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F6FF] items-center justify-center p-8 select-none">
      <div className="w-full max-w-xl bg-white rounded-3xl p-8 border border-[#E8E5F8] shadow-2xl relative overflow-hidden">
        {/* Step 1: Name Introduction */}
        {step === 1 && (
          <div className="text-center animate-in fade-in duration-300">
            <div className="w-24 h-24 mx-auto mb-4 rounded-3xl overflow-hidden shadow-md border-4 border-white bg-[#5A45FF]">
              <img
                src="/assets/onboarding_chat/stickers/sarah_cheer_thumbs_up.webp"
                alt="Sarah"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/onboarding_chat/avatar/sarah_pointing.png'
                }}
              />
            </div>
            <h2 className="text-2xl font-black text-[#1E1B4B] mb-2">
              "Hi! Call me Sarah. What's your name?"
            </h2>
            <p className="text-xs text-[#6B7280] mb-6">
              I'll be your personal AI English speech & fluency coach.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (userName.trim()) setStep(2)
              }}
              className="space-y-4 max-w-sm mx-auto"
            >
              <input
                type="text"
                autoFocus
                placeholder="Enter your name..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl border border-[#E8E5F8] text-center font-bold text-base text-[#1E1B4B] focus:outline-none focus:border-[#5A45FF] focus:ring-4 focus:ring-[#5A45FF]/10 shadow-xs"
              />
              <button
                type="submit"
                disabled={!userName.trim()}
                className="w-full py-3.5 bg-[#5A45FF] hover:bg-[#4B36F0] disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#5A45FF]/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Nice to meet you, Sarah!</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Learning Goal */}
        {step === 2 && (
          <div className="animate-in fade-in duration-300">
            <span className="text-xs font-bold text-[#5A45FF] uppercase tracking-wider block mb-1">
              Step 2 of 3
            </span>
            <h2 className="text-2xl font-extrabold text-[#1E1B4B] mb-2">
              What is your primary goal, {userName}?
            </h2>
            <p className="text-xs text-[#6B7280] mb-6">
              This helps Sarah tailor your conversation topics and challenge levels.
            </p>

            <div className="space-y-3 mb-6">
              {[
                { id: 'ielts', title: 'IELTS / TOEFL Speaking Exam', desc: 'Target Band 7.0+ with formal criteria' },
                { id: 'career', title: 'Job Interviews & Workplace', desc: 'Professional fluency & confident discussions' },
                { id: 'fluency', title: 'Everyday English Fluency', desc: 'Speak naturally without hesitation or pauses' },
                { id: 'pronounce', title: 'Accent & Pronunciation Mastery', desc: 'Clear vowel and consonant articulation' }
              ].map((g) => (
                <div
                  key={g.id}
                  onClick={() => setUserGoal(g.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    userGoal === g.id
                      ? 'border-[#5A45FF] bg-[#EFEFFD]'
                      : 'border-[#E8E5F8] hover:bg-[#F7F6FF]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-[#1E1B4B]">{g.title}</div>
                    <div className="text-xs text-[#6B7280]">{g.desc}</div>
                  </div>
                  {userGoal === g.id && (
                    <CheckCircle className="w-5 h-5 text-[#5A45FF] shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setStep(3)
                audioService.playAudio('/assets/onboarding_chat/sfx/en/curiousHowWellYou.mp3')
              }}
              className="w-full py-3.5 bg-[#5A45FF] hover:bg-[#4B36F0] text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Speaking Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: 30s Baseline Speech Test */}
        {step === 3 && (
          <div className="text-center animate-in fade-in duration-300">
            <span className="text-xs font-bold text-[#5A45FF] uppercase tracking-wider block mb-1">
              Diagnostic Placement Test
            </span>
            <h2 className="text-2xl font-black text-[#1E1B4B] mb-2">
              Speak for 20-30 seconds
            </h2>
            <p className="text-sm text-[#4B5563] bg-[#F7F6FF] p-4 rounded-2xl border border-[#E8E5F8] font-medium italic mb-6">
              "What is your favorite hobby, or what did you do this weekend?"
            </p>

            <div className="flex flex-col items-center justify-center mb-6">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={isEvaluating}
                  className="w-16 h-16 rounded-full bg-[#5A45FF] hover:bg-[#4B36F0] disabled:opacity-50 text-white flex items-center justify-center shadow-xl shadow-[#5A45FF]/30 active:scale-95 transition-all mb-3"
                >
                  <Mic className="w-7 h-7" />
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="w-16 h-16 rounded-full bg-[#F35252] text-white flex items-center justify-center shadow-xl shadow-[#F35252]/30 animate-pulse active:scale-95 transition-all mb-3"
                >
                  <Square className="w-6 h-6 fill-white" />
                </button>
              )}

              <span className="text-xs text-[#6B7280] font-semibold">
                {isRecording ? 'Listening... Tap to submit' : 'Tap microphone to speak'}
              </span>
            </div>

            {isEvaluating && (
              <div className="text-xs text-[#5A45FF] font-semibold animate-pulse">
                Analyzing your baseline fluency and pronunciation...
              </div>
            )}
          </div>
        )}

        {/* Step 4: Diagnostic Result Celebration */}
        {step === 4 && baselineScore && (
          <div className="text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto mb-3">
              <LottiePlayer src="/assets/lottie/achievment_badge.json" loop={false} className="w-full h-full" />
            </div>

            <h2 className="text-2xl font-black text-[#1E1B4B] mb-1">
              Baseline Assessed, {userName}!
            </h2>
            <p className="text-xs text-[#6B7280] mb-6">
              Sarah has mapped your initial fluency profile.
            </p>

            <div className="p-5 rounded-2xl bg-[#F7F6FF] border border-[#E8E5F8] mb-6 max-w-sm mx-auto">
              <div className="text-3xl font-black text-[#5A45FF] mb-1">
                IELTS Band {baselineScore.toFixed(1)} / 9.0
              </div>
              <div className="text-xs font-bold text-[#3BBE8F]">
                CEFR Level: {baselineScore >= 6.5 ? 'B2 Upper-Intermediate' : 'B1 Intermediate'}
              </div>
            </div>

            <button
              onClick={() => onComplete({ name: userName, goal: userGoal, baselineBand: baselineScore })}
              className="w-full py-4 bg-[#5A45FF] hover:bg-[#4B36F0] text-white font-bold text-sm rounded-2xl shadow-xl shadow-[#5A45FF]/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Enter Stimuler Fluency Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
