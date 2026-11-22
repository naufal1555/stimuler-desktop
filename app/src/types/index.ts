export type AppView = 'topics' | 'chat' | 'analysis' | 'roadmap' | 'drills' | 'settings'

export interface WordTiming {
  word: string
  start: number
  end: number
  probability: number
}

export interface Topic {
  topic_id: number | string
  topic_order: number
  title: string
  image_url: string
  image_border_color: string
  total_stars: number
  max_stars_achieved: number | null
  attempt_counter: number
  attempt_status: 'available' | 'in_progress' | 'completed' | 'premium_locked'
  open_mode: 'new' | 'resume' | 'history'
  last_conversation_id?: string | null
  meta?: {
    context?: string
    role?: string
    difficulty?: string
  }
}

export interface TopicCategory {
  category_id: number
  category_order: number
  title: string
  attempt_status: string
  star_progress: {
    total_stars: number
    stars_gained: number
  }
  topics: Topic[]
}

export interface HighlightSpan {
  start_index: number
  end_index: number
  color?: string
  underline?: boolean
  strikethrough?: boolean
}

export interface GrammarCorrection {
  original: {
    text: string
    highlights?: HighlightSpan[]
  }
  corrected: {
    text: string
    highlights?: HighlightSpan[]
  }
  reason_label?: string
  reason: string
}

export interface MispronouncedWord {
  word: string
  phonetic?: string
  user_audio_position?: {
    from_ms: number
    to_ms: number
  }
  score?: number
}

export interface VocabularySuggestion {
  wrong_word: string
  right_word: string
}

export interface TurnAnalysis {
  state: 'pending' | 'completed'
  overall_score?: number
  is_perfect?: boolean
  mistakes?: {
    status: string
    grammar?: {
      corrections: GrammarCorrection[]
    }
    pronunciation?: {
      user_transcript: {
        text: string
        highlights?: HighlightSpan[]
      }
      user_audio_url?: string
      mispronounced_words: MispronouncedWord[]
    }
    vocabulary?: {
      error?: {
        text: string
        highlights?: HighlightSpan[]
      }
      correction?: {
        text: string
        highlights?: HighlightSpan[]
      }
      suggestions_label?: string
      suggestions: VocabularySuggestion[]
    }
    fluency?: {
      improved_label?: string
      improved_speech?: string
    }
  }
}

export interface ConversationMessage {
  message_id: string
  from: 'bot' | 'user'
  step_id: number
  step_type?: string
  created_at: string
  message_template: 'bot_speech' | 'user_speech' | 'user_select_option' | 'user_pronunciation_practice'
  message_alignment: 'left' | 'right' | 'center'
  message_state: 'initial' | 'loading' | 'loaded'
  content: {
    text?: string
    audio_url?: string
    highlights?: HighlightSpan[]
    message_actions?: Array<{
      action_type: 'tts' | 'translate' | 'show_mistakes'
      enabled: boolean
      prompt_text?: string
      translated_prompt_text?: string
    }>
    available_taps?: Array<{
      tap_type: 'hint'
      enabled: boolean
      meta?: {
        prompt_text: string
        translated_prompt_text?: string
        hint_text: string
        translated_text?: string
      }
    }>
    analysis?: TurnAnalysis
    words?: WordTiming[]
    options?: Array<{ id: string; label: string }>
    multi_select?: boolean
    selected_ids?: string[]
    word?: string
    phonetic?: string
    score?: number | null
    sentence?: string | null
    practice_progress?: {
      index: number
      total: number
      word: string
    }
  }
}

export interface SessionResult {
  status: 'completed'
  display_mode: 'ielts' | 'normal'
  header: {
    avatar_url: string
    stars: {
      current: number
      total: number
      breakdown: Array<{
        key: string
        label: string
        earned: boolean
      }>
    }
    band: {
      score: string
      caption: string
    }
  }
  stats: Array<{
    key: string
    label: string
    value: string
  }>
  analysis: {
    is_analysis_available: boolean
    categories: Array<{
      key: 'pronunciation' | 'grammar' | 'vocabulary' | 'fluency'
      title: string
      score_display: {
        text: string
        fill_fraction: number
      }
      card_cta_text: string | null
      body: {
        text: string
        highlights?: HighlightSpan[]
      }
    }>
  }
}

export interface UserSettings {
  geminiApiKey: string
  engineMode: 'hybrid' | 'ollama' | 'mock'
  ollamaModel: string
  nativeLanguage: 'id' | 'en'
  dailyGoalMinutes: number
  streakCount: number
  selectedAudioDeviceId?: string
}
