import React, { useState, useEffect } from 'react'
import { UserSettings } from '../types'
import { Key, Cpu, Globe, Clock, Save, Check, Mic } from 'lucide-react'

interface SettingsModalProps {
  settings: UserSettings
  onSave: (newSettings: UserSettings) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave
}) => {
  const [form, setForm] = useState<UserSettings>(settings)
  const [savedAlert, setSavedAlert] = useState(false)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const inputs = devices.filter((d) => d.kind === 'audioinput')
        setAudioDevices(inputs)
      }).catch((err) => {
        console.warn('Microphone enumeration error:', err)
      })
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F7F6FF] p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-8 border border-[#E8E5F8] shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1E1B4B] mb-2">Application Settings</h1>
        <p className="text-xs text-[#6B7280] mb-6">
          Configure AI evaluation engine, API keys, and learning preferences.
        </p>

        {savedAlert && (
          <div className="mb-6 p-3 rounded-xl bg-[#E6F9F2] text-[#1A8B56] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gemini API Key */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E1B4B] mb-2">
              <Key className="w-4 h-4 text-[#5A45FF]" />
              <span>Google Gemini API Key (Optional / Free Tier)</span>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={form.geminiApiKey}
              onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5F8] text-sm text-[#1E1B4B] focus:outline-none focus:border-[#5A45FF] focus:ring-2 focus:ring-[#5A45FF]/10 font-mono"
            />
            <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
              If left blank, the application will use the built-in offline smart evaluation engine. Get a free API key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#5A45FF] underline">Google AI Studio</a>.
            </p>
          </div>

          {/* Engine Mode */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E1B4B] mb-2">
              <Cpu className="w-4 h-4 text-[#5A45FF]" />
              <span>AI Evaluation Engine Mode</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, engineMode: 'hybrid' })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  form.engineMode === 'hybrid'
                    ? 'border-[#5A45FF] bg-[#EFEFFD] text-[#5A45FF]'
                    : 'border-[#E8E5F8] bg-white text-[#4B5563] hover:bg-[#F7F6FF]'
                }`}
              >
                <div className="font-bold text-sm mb-1">Hybrid Mode (Recommended)</div>
                <div className="text-xs opacity-80 leading-relaxed">
                  Fast Gemini Flash + Local Whisper STT & Edge-TTS
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, engineMode: 'ollama' })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  form.engineMode === 'ollama'
                    ? 'border-[#5A45FF] bg-[#EFEFFD] text-[#5A45FF]'
                    : 'border-[#E8E5F8] bg-white text-[#4B5563] hover:bg-[#F7F6FF]'
                }`}
              >
                <div className="font-bold text-sm mb-1">100% Offline Mode</div>
                <div className="text-xs opacity-80 leading-relaxed">
                  Local smart evaluation, zero cloud requests
                </div>
              </button>
            </div>
          </div>

          {/* Native Language */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E1B4B] mb-2">
              <Globe className="w-4 h-4 text-[#5A45FF]" />
              <span>Native Language for Translations</span>
            </label>
            <select
              value={form.nativeLanguage}
              onChange={(e) => setForm({ ...form, nativeLanguage: e.target.value as any })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5F8] text-sm text-[#1E1B4B] focus:outline-none focus:border-[#5A45FF]"
            >
              <option value="id">Bahasa Indonesia (Indonesian)</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Microphone Input Device Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E1B4B] mb-2">
              <Mic className="w-4 h-4 text-[#5A45FF]" />
              <span>Microphone Input Device</span>
            </label>
            <select
              value={form.selectedAudioDeviceId || ''}
              onChange={(e) => setForm({ ...form, selectedAudioDeviceId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5F8] text-sm text-[#1E1B4B] focus:outline-none focus:border-[#5A45FF]"
            >
              <option value="">Default System Microphone</option>
              {audioDevices.map((dev, i) => (
                <option key={dev.deviceId || i} value={dev.deviceId}>
                  {dev.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#6B7280] mt-1.5">
              Select your preferred headset, USB microphone, or built-in audio input device.
            </p>
          </div>

          {/* Daily Goal */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E1B4B] mb-2">
              <Clock className="w-4 h-4 text-[#5A45FF]" />
              <span>Daily Practice Goal</span>
            </label>
            <div className="flex gap-3">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setForm({ ...form, dailyGoalMinutes: mins })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    form.dailyGoalMinutes === mins
                      ? 'border-[#5A45FF] bg-[#5A45FF] text-white'
                      : 'border-[#E8E5F8] bg-white text-[#4B5563] hover:bg-[#F7F6FF]'
                  }`}
                >
                  {mins} Mins
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#F7F6FF]">
            <button
              type="submit"
              className="w-full py-3 bg-[#5A45FF] hover:bg-[#4B36F0] text-white text-sm font-bold rounded-xl shadow-md shadow-[#5A45FF]/20 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
