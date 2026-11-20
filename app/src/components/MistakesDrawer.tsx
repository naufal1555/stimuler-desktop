import React from 'react'
import { TurnAnalysis } from '../types'
import { X, Check, AlertCircle, Sparkles, Volume2 } from 'lucide-react'
import { api } from '../services/api'
import { audioService } from '../services/audioService'

interface MistakesDrawerProps {
  analysis: TurnAnalysis | null
  onClose: () => void
}

export const MistakesDrawer: React.FC<MistakesDrawerProps> = ({
  analysis,
  onClose
}) => {
  if (!analysis) return null

  const mistakes = analysis.mistakes
  const grammarCorrections = mistakes?.grammar?.corrections || []
  const pronunciationWords = mistakes?.pronunciation?.mispronounced_words || []
  const vocabSuggestions = mistakes?.vocabulary?.suggestions || []
  const improvedSpeech = mistakes?.fluency?.improved_speech

  const playWordSample = async (word: string) => {
    try {
      const res = await api.getTTS(word)
      audioService.playAudio(res.audio_url)
    } catch (e) {
      console.warn('Word audio failed:', e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E5F8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF5EA] text-[#F9A834] flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E1B4B]">Feedback from Sarah</h3>
              <div className="text-xs text-[#6B7280]">Detailed error breakdown & native phrasing</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7280] hover:bg-[#F7F6FF] hover:text-[#1E1B4B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Improved Version / Fluency */}
          {improvedSpeech && (
            <div className="p-4 rounded-2xl bg-[#F7F6FF] border border-[#E8E5F8]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#5A45FF] uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Improved Native Phrasing</span>
              </div>
              <p className="text-sm font-semibold text-[#1E1B4B] leading-relaxed mb-3">
                "{improvedSpeech}"
              </p>
              <button
                onClick={() => {
                  api.getTTS(improvedSpeech).then((r) => audioService.playAudio(r.audio_url))
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5F8] hover:bg-[#EFEFFD] text-xs font-semibold text-[#5A45FF] flex items-center gap-1.5 shadow-xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen to native model</span>
              </button>
            </div>
          )}

          {/* 2. Grammar Corrections */}
          {grammarCorrections.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
                Grammar Corrections ({grammarCorrections.length})
              </h4>
              <div className="space-y-3">
                {grammarCorrections.map((gc, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-[#FDE0C5] bg-[#FFFBF6] space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#F35252]/10 text-[#F35252] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        &times;
                      </span>
                      <p className="text-sm text-[#4B5563] line-through decoration-[#F35252] decoration-2">
                        {gc.original.text}
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#3BBE8F]/10 text-[#3BBE8F] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <p className="text-sm font-semibold text-[#1E1B4B]">
                        {gc.corrected.text}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#FEEAD8] text-xs text-[#8C4A00] font-medium leading-relaxed">
                      💡 {gc.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Mispronounced Words */}
          {pronunciationWords.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
                Pronunciation Focus Words
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {pronunciationWords.map((pw, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border border-[#E8E5F8] bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#1E1B4B]">{pw.word}</div>
                      {pw.phonetic && (
                        <div className="text-xs text-[#6B7280] font-mono">{pw.phonetic}</div>
                      )}
                    </div>
                    <button
                      onClick={() => playWordSample(pw.word)}
                      className="w-8 h-8 rounded-xl bg-[#F7F6FF] hover:bg-[#5A45FF] hover:text-white text-[#5A45FF] flex items-center justify-center transition-colors"
                      title="Listen"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Vocabulary Upgrades */}
          {vocabSuggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
                Better Vocabulary Upgrades
              </h4>
              <div className="space-y-2.5">
                {vocabSuggestions.map((sug, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-[#E8E5F8] bg-white flex items-center justify-between text-xs"
                  >
                    <span className="text-[#6B7280] line-through font-medium">"{sug.wrong_word}"</span>
                    <span className="font-bold text-[#5A45FF] bg-[#EFEFFD] px-2.5 py-1 rounded-lg">
                      "{sug.right_word}"
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E5F8] bg-[#F7F6FF]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1E1B4B] hover:bg-[#2C2766] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            Got It, Back to Chat
          </button>
        </div>
      </div>
    </div>
  )
}
