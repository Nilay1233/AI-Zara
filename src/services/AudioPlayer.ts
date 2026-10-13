/**
 * AudioPlayer
 * Handles gapless playback of 24kHz 16-bit Linear PCM audio chunks received
 * from Gemini Live API. Implements precision start-time scheduling, instant interruption
 * cancellation, and real-time audio analysis for Zara's reactive visualizer.
 */

export class AudioPlayer {
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private isPlaying: boolean = false;
  private onSpeakingChangeCallback: ((speaking: boolean) => void) | null = null;
  private onAmplitudeCallback: ((amp: number) => void) | null = null;
  private animFrame: number | null = null;
  private checkIdleTimeout: any = null;

  constructor(
    onSpeakingChange?: (speaking: boolean) => void,
    onAmplitude?: (amp: number) => void
  ) {
    this.onSpeakingChangeCallback = onSpeakingChange || null;
    this.onAmplitudeCallback = onAmplitude || null;
  }

  public async init(): Promise<void> {
    if (this.audioCtx) return;

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
    } catch {
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.5;
    this.analyserNode.connect(this.audioCtx.destination);

    this.startAnalysisLoop();
  }

  public queuePcmChunk(base64Data: string): void {
    if (!this.audioCtx || !this.analyserNode) {
      this.init().then(() => this.queuePcmChunk(base64Data));
      return;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    try {
      // Decode Base64 string to Uint8Array
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert Uint8Array to Int16Array little-endian
      const int16 = new Int16Array(bytes.buffer);
      if (int16.length === 0) return;

      // Convert Int16 to Float32 [-1.0, 1.0]
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      // Create 24kHz audio buffer
      const audioBuffer = this.audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyserNode);

      const now = this.audioCtx.currentTime;
      // If nextStartTime is in the past, add a small 25ms lead-in jitter buffer
      if (this.nextStartTime < now) {
        this.nextStartTime = now + 0.025;
      }

      source.start(this.nextStartTime);
      this.activeSources.add(source);

      // Advance schedule pointer by duration
      const chunkEndTime = this.nextStartTime + audioBuffer.duration;
      this.nextStartTime = chunkEndTime;

      this.setSpeaking(true);

      // Handle individual source completion
      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          // Check if queue has really cleared
          this.scheduleIdleCheck();
        }
      };
    } catch (err) {
      console.error('[AudioPlayer] Error decoding PCM chunk:', err);
    }
  }

  private scheduleIdleCheck() {
    if (this.checkIdleTimeout) clearTimeout(this.checkIdleTimeout);
    this.checkIdleTimeout = setTimeout(() => {
      if (this.audioCtx && this.audioCtx.currentTime >= this.nextStartTime - 0.05) {
        this.setSpeaking(false);
      }
    }, 120);
  }

  private setSpeaking(speaking: boolean) {
    if (this.isPlaying !== speaking) {
      this.isPlaying = speaking;
      if (this.onSpeakingChangeCallback) {
        this.onSpeakingChangeCallback(speaking);
      }
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Immediately interrupts playback, cuts active audio sources,
   * flushes scheduled buffer queue, and resets timing.
   */
  public interrupt(): void {
    if (this.checkIdleTimeout) clearTimeout(this.checkIdleTimeout);

    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSources.clear();

    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }

    this.setSpeaking(false);
    if (this.onAmplitudeCallback) {
      this.onAmplitudeCallback(0);
    }
  }

  private startAnalysisLoop() {
    if (!this.analyserNode) return;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const tick = () => {
      if (!this.analyserNode) return;

      if (this.isPlaying) {
        this.analyserNode.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const amp = Math.min(1, rms * 4.0);
        if (this.onAmplitudeCallback) {
          this.onAmplitudeCallback(amp);
        }
      } else {
        if (this.onAmplitudeCallback) {
          this.onAmplitudeCallback(0);
        }
      }

      this.animFrame = requestAnimationFrame(tick);
    };

    this.animFrame = requestAnimationFrame(tick);
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode && this.isPlaying) {
      this.analyserNode.getByteFrequencyData(array as any);
    } else {
      array.fill(0);
    }
  }

  public stop(): void {
    this.interrupt();

    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {}
      this.analyserNode = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}
