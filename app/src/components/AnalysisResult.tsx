import React, { useState } from 'react'
import { SessionResult, ConversationMessage } from '../types'
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  MessageSquare, 
  Mic, 
  Volume2, 
  ArrowLeft,
  RotateCcw,
  CheckCircle2
} from 'lucide-react'
import { LottiePlayer } from './LottiePlayer'
import { audioService } from '../services/audioService'

interface AnalysisResultProps {
  result: SessionResult
  messages: ConversationMessage[]
  onBackToTopics: () => void
  onPracticeDrill: () => void
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
  result,
  messages,
  onBackToTopics,
  onPracticeDrill
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'recordings' | 'grammar' | 'fluency' | 'pronunciation'>('overview')

  const userRecordings = messages.filter((m) => m.from === 'user')

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F7F6FF] p-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToTopics}
          className="flex items-center gap-2 text-sm font-semibold text-[#6B7280] hover:text-[#1E1B4B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Topics</span>
        </button>

        <button
          onClick={onPracticeDrill}
          className="px-4 py-2 bg-[#5A45FF] hover:bg-[#4B36F0] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Practice Error Words Now</span>
        </button>
      </div>

      {/* IELTS Band Hero Card with Extracted Lottie */}
      <div className="bg-gradient-to-tr from-[#1E1B4B] to-[#3B3294] text-white rounded-3xl p-8 mb-6 shadow-xl relative overflow-hidden">
        {/* Background Confetti Lottie */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <LottiePlayer src="/assets/lottie/star_conv_background_confetti.json" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 shrink-0">
              <LottiePlayer src="/assets/lottie/achievment_badge.json" loop={false} className="w-full h-full" />
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#F9A834] mb-2">
                <Trophy className="w-3.5 h-3.5 fill-[#F9A834]" />
                <span>Session Assessment</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1">
                {result.header.band.score}
              </h1>
              <p className="text-xs text-white/80 max-w-md">
                {result.header.band.caption}
              </p>
            </div>
          </div>

          {/* Stars Earned Breakdown */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shrink-0 w-full md:w-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3">
              Stars Earned ({result.header.stars.current}/{result.header.stars.total})
            </div>
            <div className="space-y-2">
              {result.header.stars.breakdown.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <Sparkles className={`w-3.5 h-3.5 ${s.earned ? 'text-[#F9A834] fill-[#F9A834]' : 'text-white/30'}`} />
                  <span className={s.earned ? 'text-white font-semibold' : 'text-white/40'}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-[#E8E5F8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFEFFD] text-[#5A45FF] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#6B7280] font-medium">Chat Turns</div>
            <div className="text-base font-bold text-[#1E1B4B]">{messages.length} Messages</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E5F8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF5EA] text-[#F9A834] flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#6B7280] font-medium">Words Spoken</div>
            <div className="text-base font-bold text-[#1E1B4B]">
              {userRecordings.reduce((acc, m) => acc + (m.content.text?.split(' ').length || 0), 0)} Words
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E5F8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E6F9F2] text-[#3BBE8F] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#6B7280] font-medium">Session Duration</div>
            <div className="text-base font-bold text-[#1E1B4B]">2 Min 15 Sec</div>
          </div>
        </div>
      </div>

      {/* Category Evaluation Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-[#1E1B4B] mb-4">Core Skill Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.analysis.categories.map((cat) => (
            <div
              key={cat.key}
              className="bg-white rounded-2xl p-5 border border-[#E8E5F8] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-base text-[#1E1B4B]">{cat.title}</span>
                  <span className="text-sm font-black text-[#5A45FF] bg-[#EFEFFD] px-2.5 py-0.5 rounded-full">
                    {cat.score_display.text}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F7F6FF] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-[#5A45FF] to-[#3BBE8F] rounded-full transition-all duration-500"
                    style={{ width: `${cat.score_display.fill_fraction * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  {cat.body.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Speech Audio Recordings Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E5F8]">
        <h2 className="text-lg font-bold text-[#1E1B4B] mb-4">Your Speech Recordings</h2>
        <div className="space-y-4">
          {userRecordings.map((rec, i) => (
            <div
              key={rec.message_id}
              className="p-4 rounded-xl bg-[#F7F6FF] border border-[#E8E5F8] flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#5A45FF]">Turn #{i + 1}</span>
                  <span className="text-xs text-[#6B7280]">• Score: {rec.content.analysis?.overall_score || 80}%</span>
                </div>
                <p className="text-sm text-[#1E1B4B] font-medium italic">
                  "{rec.content.text}"
                </p>
              </div>

              {rec.content.audio_url && (
                <button
                  onClick={() => audioService.playAudio(rec.content.audio_url!)}
                  className="px-3 py-1.5 bg-white border border-[#E8E5F8] hover:bg-[#EFEFFD] text-[#5A45FF] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Play Voice</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
