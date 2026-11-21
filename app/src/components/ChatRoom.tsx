import React, { useState, useEffect, useRef } from 'react'
import { Topic, ConversationMessage, TurnAnalysis } from '../types'
import { audioService } from '../services/audioService'
import { api } from '../services/api'
import { 
  Volume2, 
  Languages, 
  AlertCircle, 
  Mic, 
  Square, 
  Lightbulb, 
  ArrowLeft,
  Sparkles,
  ChevronRight,
  CheckCircle
} from 'lucide-react'
import { LottiePlayer } from './LottiePlayer'

interface ChatRoomProps {
  topic: Topic
  onBack: () => void
  onFinishSession: (finalMessages: ConversationMessage[]) => void
  onOpenMistakes: (analysis: TurnAnalysis) => void
  onOpenSettings?: () => void
  apiKey?: string
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  topic,
  onBack,
  onFinishSession,
  onOpenMistakes,
  onOpenSettings,
  apiKey
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeHint, setActiveHint] = useState<string | null>(null)
  const [activeTranslationId, setActiveTranslationId] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [stars, setStars] = useState({ current: 0, total: 3 })
  const [toast, setToast] = useState<{ type: 'error' | 'warning' | 'info'; text: string } | null>(null)
  const [isBackendConnected, setIsBackendConnected] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)

  const showToast = (type: 'error' | 'warning' | 'info', text: string) => {
    setToast({ type, text })
    setTimeout(() => {
      setToast((current) => (current?.text === text ? null : current))
    }, 5000)
  }

  // Periodic heartbeat monitor
  useEffect(() => {
    let isMounted = true
    const checkConnection = async () => {
      const ok = await api.checkHealth()
      if (isMounted) setIsBackendConnected(ok)
    }
    checkConnection()
    const interval = setInterval(checkConnection, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Initialize conversation with Sarah's opening greeting
  useEffect(() => {
    const initSarahGreeting = async () => {
      setIsProcessing(true)
      const greetingText = `Hi! I'm Sarah. Let's talk about "${topic.title}". What are your thoughts or experiences with this?`
      
      let audioUrl: string | undefined = undefined
      try {
        const ttsRes = await api.getTTS(greetingText)
        audioUrl = ttsRes.audio_url
      } catch (e) {
        console.warn('Initial TTS failed:', e)
      }

      const initialBotMessage: ConversationMessage = {
        message_id: 'msg_0',
        from: 'bot',
        step_id: 1,
        created_at: new Date().toISOString(),
        message_template: 'bot_speech',
        message_alignment: 'left',
        message_state: 'loaded',
        content: {
          text: greetingText,
          audio_url: audioUrl,
          message_actions: [
            { action_type: 'tts', enabled: true },
            { action_type: 'translate', enabled: true }
          ],
          available_taps: [
            {
              tap_type: 'hint',
              enabled: true,
              meta: {
                prompt_text: 'Tap for hint',
                hint_text: `I really enjoy ${topic.title.toLowerCase()} because it helps me relax and learn new things.`
              }
            }
          ]
        }
      }

      setMessages([initialBotMessage])
      setIsProcessing(false)

      // Auto play Sarah's greeting
      if (audioUrl) {
        audioService.playAudio(audioUrl)
      }
    }

    initSarahGreeting()

    return () => {
      audioService.stopPlayback()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [topic])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing])

  // Start Mic Recording
  const handleStartRecording = async () => {
    try {
      audioService.playSFX('tone.mp3')
      setRecordingSeconds(0)
      setIsRecording(true)

      await audioService.startRecording((level) => {
        setAudioLevel(level)
      })

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            handleStopAndSubmit()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      alert('Microphone access is required to practice speaking.')
      setIsRecording(false)
    }
  }

  // Stop Mic and Submit Speech for Evaluation
  const handleStopAndSubmit = async () => {
    if (!isRecording) return
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)

    setIsProcessing(true)
    audioService.playSFX('calling_cut_tone.mp3')

    try {
      const audioBlob = await audioService.stopRecording()
      
      // 1. Transcribe Audio
      const transcribeRes = await api.transcribeAudio(audioBlob)
      const rawText = (transcribeRes.text || '').trim()

      if (!rawText || rawText.startsWith('(') || rawText.length === 0) {
        showToast('warning', rawText || 'Suara tidak terdeteksi jelas. Mohon berbicara lebih dekat ke mikrofon dan coba lagi.')
        setIsProcessing(false)
        return
      }

      const userText = rawText

      // 2. Evaluate with Sarah AI Engine (Gemini Flash or Offline Evaluator)
      const evalData = await api.evaluateSpeech({
        userSpeech: userText,
        topicTitle: topic.title,
        history: messages,
        apiKey: apiKey
      })

      const userMsgId = `user_${Date.now()}`
      const botMsgId = `bot_${Date.now()}`

      const userTurnAnalysis: TurnAnalysis = {
        state: 'completed',
        overall_score: evalData.overall_score || 82,
        is_perfect: (evalData.overall_score || 82) > 90,
        mistakes: {
          status: 'completed',
          grammar: {
            corrections: evalData.grammar_corrections?.map((gc: any) => ({
              original: { text: gc.original },
              corrected: { text: gc.corrected },
              reason: gc.reason
            })) || []
          },
          pronunciation: {
            user_transcript: { text: userText },
            user_audio_url: transcribeRes.audio_url,
            mispronounced_words: (evalData.mispronounced_words || []).map((w: string) => ({
              word: w,
              score: 65
            }))
          },
          vocabulary: {
            suggestions: evalData.vocabulary_suggestions || []
          },
          fluency: {
            improved_speech: evalData.improved_speech
          }
        }
      }

      // User Message Object
      const userMessage: ConversationMessage = {
        message_id: userMsgId,
        from: 'user',
        step_id: messages.length + 1,
        created_at: new Date().toISOString(),
        message_template: 'user_speech',
        message_alignment: 'right',
        message_state: 'loaded',
        content: {
          text: userText,
          audio_url: transcribeRes.audio_url,
          analysis: userTurnAnalysis,
          message_actions: [
            {
              action_type: 'show_mistakes',
              enabled: true,
              prompt_text: 'View Mistakes'
            }
          ]
        }
      }

      // Sarah Response Message Object
      const botMessage: ConversationMessage = {
        message_id: botMsgId,
        from: 'bot',
        step_id: messages.length + 2,
        created_at: new Date().toISOString(),
        message_template: 'bot_speech',
        message_alignment: 'left',
        message_state: 'loaded',
        content: {
          text: evalData.reply_text,
          audio_url: evalData.audio_url,
          message_actions: [
            { action_type: 'tts', enabled: true },
            { action_type: 'translate', enabled: true }
          ],
          available_taps: [
            {
              tap_type: 'hint',
              enabled: true,
              meta: {
                prompt_text: 'Tap for hint',
                hint_text: evalData.hint_text || 'Another perspective is to look at how people communicate.'
              }
            }
          ]
        }
      }

      setMessages((prev) => [...prev, userMessage, botMessage])
      setStars((prev) => ({ ...prev, current: Math.min(prev.total, prev.current + 1) }))
      audioService.playSFX('reward_dialog_coins.mp3')

      // Play Sarah's reply voice
      if (evalData.audio_url) {
        audioService.playAudio(evalData.audio_url)
      }
    } catch (err) {
      console.error('Submission error:', err)
      showToast('error', 'Koneksi ke AI Backend terputus atau respon lambat. Mohon coba rekam kembali.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Translate toggle
  const handleToggleTranslate = async (msgId: string, text: string) => {
    if (activeTranslationId === msgId) {
      setActiveTranslationId(null)
      return
    }

    if (!translations[msgId]) {
      const translated = await api.translate(text, 'id')
      setTranslations((prev) => ({ ...prev, [msgId]: translated }))
    }
    setActiveTranslationId(msgId)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F6FF] relative">
      {/* Top Navigation & Status Bar */}
      <header className="h-16 px-6 bg-white border-b border-[#E8E5F8] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-[#6B7280] hover:bg-[#F7F6FF] hover:text-[#1E1B4B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-base text-[#1E1B4B] leading-tight">{topic.title}</h2>
            <div className="text-xs text-[#6B7280] font-medium flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-[#3BBE8F]' : 'bg-[#F59E0B] animate-pulse'}`} />
              <span>{isBackendConnected ? 'Conversation with Sarah' : 'Reconnecting to AI Backend...'}</span>
            </div>
          </div>
        </div>

        {/* Stars Counter & Finish Action */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF9E6] border border-[#FFE8A3] rounded-full text-xs font-bold text-[#F9A834]">
            <Sparkles className="w-3.5 h-3.5 fill-[#F9A834]" />
            <span>{stars.current}/{stars.total} Stars</span>
          </div>

          <button
            onClick={() => onFinishSession(messages)}
            className="px-4 py-2 bg-[#5A45FF] hover:bg-[#4B36F0] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Finish & View Analysis</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`px-6 py-2.5 flex items-center justify-between text-xs transition-all shadow-sm shrink-0 ${
          toast.type === 'error'
            ? 'bg-[#FEF2F2] border-b border-[#FCA5A5] text-[#991B1B]'
            : toast.type === 'warning'
            ? 'bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E]'
            : 'bg-[#EFF6FF] border-b border-[#BFDBFE] text-[#1E40AF]'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AI Engine Status Banner */}
      {!apiKey && (
        <div className="bg-[#FFF4E5] border-b border-[#FFE0B2] px-6 py-2.5 flex items-center justify-between text-xs text-[#B45309] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            <span className="font-semibold">Mode Fallback (Tanpa Gemini API Key):</span>
            <span className="opacity-90">Sarah menggunakan aturan offline terbatas. Masukkan Google Gemini API Key gratis untuk mengaktifkan AI percakapan cerdas tanpa template.</span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-3 py-1 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-lg transition-colors whitespace-nowrap ml-4"
            >
              Buka Pengaturan
            </button>
          )}
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
        {messages.map((msg) => {
          const isBot = msg.from === 'bot'
          return (
            <div
              key={msg.message_id}
              className={`flex items-start gap-3.5 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {/* Sarah Avatar */}
              {isBot && (
                <div className="w-10 h-10 rounded-2xl bg-white overflow-hidden shrink-0 shadow-sm border border-[#E8E5F8]">
                  <img
                    src="/assets/images/avatar_sarah_still.webp"
                    alt="Sarah"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/onboarding_chat/v3_sarah_avatar.webp'
                    }}
                  />
                </div>
              )}

              {/* Message Content Bubble */}
              <div className={`max-w-lg rounded-2xl p-4 shadow-sm ${
                isBot 
                  ? 'bg-white border border-[#E8E5F8] text-[#1E1B4B]' 
                  : 'bg-[#5A45FF] text-white'
              }`}>
                {/* Text Content */}
                <p className="text-sm leading-relaxed mb-3 font-medium">
                  {msg.content.text}
                </p>

                {/* Translation Box if Active */}
                {activeTranslationId === msg.message_id && translations[msg.message_id] && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[#F7F6FF] border border-[#E8E5F8] text-xs text-[#4B5563] italic">
                    {translations[msg.message_id]}
                  </div>
                )}

                {/* Sarah Actions (TTS & Translate) */}
                {isBot && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#F7F6FF]">
                    {msg.content.audio_url && (
                      <button
                        onClick={() => audioService.playAudio(msg.content.audio_url!)}
                        className="px-2.5 py-1 rounded-lg bg-[#F7F6FF] hover:bg-[#EFEFFD] text-xs font-semibold text-[#5A45FF] flex items-center gap-1 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleTranslate(msg.message_id, msg.content.text || '')}
                      className="px-2.5 py-1 rounded-lg bg-[#F7F6FF] hover:bg-[#EFEFFD] text-xs font-semibold text-[#6B7280] flex items-center gap-1 transition-colors"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>{activeTranslationId === msg.message_id ? 'Hide ID' : 'Translate ID'}</span>
                    </button>

                    {msg.content.available_taps?.[0] && (
                      <button
                        onClick={() => setActiveHint(msg.content.available_taps![0].meta?.hint_text || null)}
                        className="px-2.5 py-1 rounded-lg bg-[#FFF9E6] hover:bg-[#FFF3CC] text-xs font-semibold text-[#8C4A00] flex items-center gap-1 transition-colors ml-auto"
                      >
                        <Lightbulb className="w-3.5 h-3.5 fill-[#F9A834]" />
                        <span>Hint</span>
                      </button>
                    )}
                  </div>
                )}

                {/* User Actions (Listen Audio & View Mistakes) */}
                {!isBot && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/20">
                    {msg.content.audio_url && (
                      <button
                        onClick={() => audioService.playAudio(msg.content.audio_url!)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>My Voice</span>
                      </button>
                    )}

                    {msg.content.analysis && (
                      <button
                        onClick={() => onOpenMistakes(msg.content.analysis!)}
                        className="px-3 py-1 rounded-lg bg-white text-[#5A45FF] hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ml-auto"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>View Mistakes ({msg.content.analysis.overall_score}%)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Processing Indicator with Extracted Lottie */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280] bg-white px-4 py-2 rounded-full border border-[#E8E5F8] w-fit shadow-sm">
            <div className="w-5 h-5 shrink-0">
              <LottiePlayer src="/assets/lottie/star_loading.json" className="w-full h-full" />
            </div>
            <span>Sarah is evaluating your pronunciation and speech...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Hint Modal Overlay */}
      {activeHint && (
        <div className="absolute inset-x-0 bottom-24 flex justify-center px-4 pointer-events-none">
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-[#FDE0C5] max-w-md w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#8C4A00]">
                <Lightbulb className="w-4 h-4 fill-[#F9A834]" />
                <span>Suggested Answer Idea</span>
              </span>
              <button
                onClick={() => setActiveHint(null)}
                className="text-xs text-[#6B7280] hover:text-[#1E1B4B] font-semibold"
              >
                Dismiss
              </button>
            </div>
            <p className="text-sm text-[#1E1B4B] font-medium leading-relaxed mb-3">
              "{activeHint}"
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  api.getTTS(activeHint).then((r) => audioService.playAudio(r.audio_url))
                }}
                className="px-2.5 py-1 rounded-lg bg-[#F7F6FF] text-xs font-semibold text-[#5A45FF] flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Sample</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 60-Second Magic: Audio Recording Bar */}
      <footer className="bg-white border-t border-[#E8E5F8] p-4 shrink-0 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
          {/* Waveform / Level Monitor */}
          <div className="flex-1 flex items-center gap-3 bg-[#F7F6FF] px-4 py-3 rounded-2xl border border-[#E8E5F8]">
            {isRecording ? (
              <>
                <span className="w-3 h-3 rounded-full bg-[#F35252] animate-ping shrink-0" />
                <div className="flex-1 flex items-center gap-1 h-6">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#5A45FF] rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(15, Math.min(100, audioLevel * (0.5 + Math.random())))}%`
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#F35252] font-mono shrink-0">
                  {60 - recordingSeconds}s
                </span>
              </>
            ) : (
              <div className="text-xs text-[#6B7280] font-medium text-center w-full">
                Tap the microphone button to start your 60-second speech
              </div>
            )}
          </div>

          {/* Big Action Mic Button with Extracted Lottie */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="w-14 h-14 rounded-2xl bg-[#5A45FF] hover:bg-[#4B36F0] disabled:opacity-50 text-white flex items-center justify-center shadow-lg shadow-[#5A45FF]/30 transition-all active:scale-95 shrink-0"
              title="Tap to Speak"
            >
              <Mic className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleStopAndSubmit}
              className="w-14 h-14 rounded-2xl bg-[#F35252] text-white flex items-center justify-center shadow-lg shadow-[#F35252]/30 active:scale-95 shrink-0 relative overflow-hidden"
              title="Tap to Submit"
            >
              <div className="absolute inset-0 pointer-events-none opacity-80 scale-125">
                <LottiePlayer src="/assets/lottie/mic_button_indonesia.json" className="w-full h-full" />
              </div>
              <Square className="w-5 h-5 fill-white relative z-10" />
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
