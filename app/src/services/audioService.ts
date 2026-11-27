export interface RecordingOptions {
  onAudioLevel?: (level: number) => void
  onFrequencyData?: (bands: number[]) => void
  bandsCount?: number
  deviceId?: string
}

class AudioService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private currentAudio: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private micStream: MediaStream | null = null
  private animFrameId: number | null = null
  private playbackListeners: Set<(isPlaying: boolean) => void> = new Set()
  private playbackSpeed: number = 1.0

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed
    if (this.currentAudio) {
      this.currentAudio.playbackRate = speed
    }
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed
  }

  subscribePlayback(listener: (isPlaying: boolean) => void): () => void {
    this.playbackListeners.add(listener)
    listener(this.isPlaying())
    return () => {
      this.playbackListeners.delete(listener)
    }
  }

  private notifyPlayback(isPlaying: boolean): void {
    this.playbackListeners.forEach((fn) => fn(isPlaying))
  }

  isPlaying(): boolean {
    return !!this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended
  }

  async startRecording(
    listenerOrOptions?: ((level: number) => void) | RecordingOptions
  ): Promise<void> {
    this.stopPlayback()
    this.audioChunks = []

    let onAudioLevel: ((level: number) => void) | undefined
    let onFrequencyData: ((bands: number[]) => void) | undefined
    let bandsCount = 24
    let deviceId: string | undefined

    if (typeof listenerOrOptions === 'function') {
      onAudioLevel = listenerOrOptions
    } else if (listenerOrOptions) {
      onAudioLevel = listenerOrOptions.onAudioLevel
      onFrequencyData = listenerOrOptions.onFrequencyData
      bandsCount = listenerOrOptions.bandsCount || 24
      deviceId = listenerOrOptions.deviceId
    }

    const audioConstraints: MediaTrackConstraints = {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
    if (deviceId) {
      audioConstraints.deviceId = { exact: deviceId }
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints
    })

    const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 }
      : undefined
    this.mediaRecorder = new MediaRecorder(this.micStream, options)

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }

    // High-resolution real-time audio frequency visualizer via AnalyserNode
    if (onAudioLevel || onFrequencyData) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        this.audioContext = new AudioContextClass()
        const source = this.audioContext.createMediaStreamSource(this.micStream)
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 128
        this.analyser.smoothingTimeConstant = 0.65
        source.connect(this.analyser)

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount)

        const checkLevel = () => {
          if (!this.analyser || !this.mediaRecorder || this.mediaRecorder.state !== 'recording') return
          this.analyser.getByteFrequencyData(dataArray)

          if (onAudioLevel) {
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i]
            }
            const avg = sum / dataArray.length
            const normalized = Math.min(100, Math.round((avg / 255) * 100 * 1.5))
            onAudioLevel(normalized)
          }

          if (onFrequencyData) {
            // Group FFT bins into bands representing speech frequencies (80Hz - 4kHz)
            const step = Math.max(1, Math.floor(dataArray.length / bandsCount))
            const bands: number[] = []
            for (let b = 0; b < bandsCount; b++) {
              const val = dataArray[Math.min(dataArray.length - 1, b * step)]
              bands.push(Math.min(100, Math.round((val / 255) * 100)))
            }
            onFrequencyData(bands)
          }

          this.animFrameId = requestAnimationFrame(checkLevel)
        }
        checkLevel()
      } catch (err) {
        console.warn('Audio level monitoring failed:', err)
      }
    }

    this.mediaRecorder.start()
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(new Blob([], { type: 'audio/webm' }))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.cleanup()
        resolve(audioBlob)
      }

      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData()
        }
      } catch (e) {
        // ignore
      }

      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop()
        }
      }, 180)
    })
  }

  playAudio(url: string, onEnded?: () => void): HTMLAudioElement {
    this.stopPlayback()
    this.currentAudio = new Audio(url)
    this.currentAudio.playbackRate = this.playbackSpeed
    this.notifyPlayback(true)
    this.currentAudio.onended = () => {
      this.currentAudio = null
      this.notifyPlayback(false)
      if (onEnded) {
        onEnded()
      }
    }
    this.currentAudio.onerror = () => {
      this.currentAudio = null
      this.notifyPlayback(false)
    }
    this.currentAudio.play().catch((err) => {
      console.warn('Audio playback error:', err)
      this.notifyPlayback(false)
    })
    return this.currentAudio
  }

  playSFX(sfxName: string): void {
    const sfxPath = `/assets/onboarding_chat/sfx/${sfxName}`
    const sound = new Audio(sfxPath)
    sound.volume = 0.7
    sound.play().catch(() => {})
  }

  stopPlayback(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
      this.notifyPlayback(false)
    }
  }

  private cleanup(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop())
      this.micStream = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
    this.analyser = null
    this.mediaRecorder = null
  }
}

export const audioService = new AudioService()
