import { TopicCategory, SessionResult } from '../types'

const BASE_URL = 'http://localhost:8765'

export const api = {
  async getTopics(): Promise<{ categories: TopicCategory[] }> {
    try {
      const res = await fetch(`${BASE_URL}/api/topics`)
      if (!res.ok) throw new Error('Failed to fetch topics')
      const json = await res.json()
      return { categories: json.data?.categories || [] }
    } catch (e) {
      // Fallback to static mock data in public assets
      const res = await fetch('/assets/mock_data/conversation_v4_topics.json')
      const json = await res.json()
      return { categories: json.data?.categories || [] }
    }
  },

  async getCourses(): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/api/courses`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const json = await res.json()
      return json.data?.courses || []
    } catch (e) {
      const res = await fetch('/assets/mock_data/courses.json')
      const json = await res.json()
      return json.data?.courses || []
    }
  },

  async getDefaultAnalysis(): Promise<SessionResult> {
    try {
      const res = await fetch(`${BASE_URL}/api/analysis/default`)
      if (!res.ok) throw new Error('Failed to fetch default analysis')
      const json = await res.json()
      return json
    } catch (e) {
      const res = await fetch('/assets/mock_data/conversation_v4_result.json')
      return await res.json()
    }
  },

  async transcribeAudio(audioBlob: Blob): Promise<{ text: string; duration: number; wpm: number; audio_url: string; words?: any[] }> {
    const formData = new FormData()
    formData.append('file', audioBlob, 'speech.wav')
    const res = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) throw new Error('Transcription failed')
    return await res.json()
  },

  async evaluateSpeech(params: {
    userSpeech: string
    topicTitle: string
    history?: any[]
    apiKey?: string
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_speech: params.userSpeech,
        topic_title: params.topicTitle,
        conversation_history: params.history || [],
        api_key: params.apiKey || undefined
      })
    })
    if (!res.ok) throw new Error('Evaluation failed')
    const json = await res.json()
    return json.data
  },

  async evaluatePronunciation(params: {
    audioBlob: Blob
    targetWord: string
    syllables?: string[]
    stressedIndex?: number
  }): Promise<{
    target_word: string
    transcribed_word: string
    score: number
    is_correct: boolean
    accuracy_level: string
    confidence: number
    syllables: Array<{ syllable: string; score: number; is_stressed: boolean }>
    feedback: string
  }> {
    const formData = new FormData()
    formData.append('file', params.audioBlob, 'drill.wav')
    formData.append('target_word', params.targetWord)
    if (params.syllables) {
      formData.append('syllables', JSON.stringify(params.syllables))
    }
    formData.append('stressed_index', String(params.stressedIndex ?? 0))

    const res = await fetch(`${BASE_URL}/api/pronunciation/evaluate`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) throw new Error('Pronunciation evaluation failed')
    const json = await res.json()
    return json.data
  },

  async getTTS(text: string): Promise<{ audio_url: string }> {
    const res = await fetch(`${BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    if (!res.ok) throw new Error('TTS failed')
    return await res.json()
  },

  async translate(text: string, targetLang = 'id'): Promise<string> {
    try {
      const res = await fetch(`${BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: targetLang })
      })
      if (res.ok) {
        const json = await res.json()
        return json.translated_text || text
      }
    } catch (e) {
      console.warn('Translation call failed:', e)
    }
    return text
  },

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/api/health`, { method: 'GET' })
      return res.ok
    } catch {
      return false
    }
  }
}
