class AudioService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private currentAudio: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private micStream: MediaStream | null = null

  async startRecording(onAudioLevel?: (level: number) => void): Promise<void> {
    this.stopPlayback()
    this.audioChunks = []

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
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

    // Audio level analyser for waveform visualization
    if (onAudioLevel) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        this.audioContext = new AudioContextClass()
        const source = this.audioContext.createMediaStreamSource(this.micStream)
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 64
        source.connect(this.analyser)

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
        const checkLevel = () => {
          if (!this.analyser || !this.mediaRecorder || this.mediaRecorder.state !== 'recording') return
          this.analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          const normalized = Math.min(100, Math.round((avg / 255) * 100 * 1.5))
          onAudioLevel(normalized)
          requestAnimationFrame(checkLevel)
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
    if (onEnded) {
      this.currentAudio.onended = () => {
        this.currentAudio = null
        onEnded()
      }
    }
    this.currentAudio.play().catch((e) => console.warn('Audio playback prevented:', e))
    return this.currentAudio
  }

  stopPlayback(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  playSFX(sfxName: string): void {
    const sfxPath = `/assets/audio/${sfxName}`
    const sound = new Audio(sfxPath)
    sound.volume = 0.6
    sound.play().catch(() => {})
  }

  private cleanup(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop())
      this.micStream = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }
    this.analyser = null
  }
}

export const audioService = new AudioService()
