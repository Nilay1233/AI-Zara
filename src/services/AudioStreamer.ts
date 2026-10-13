/**
 * AudioStreamer
 * Resilient microphone capture with fallback to Virtual Voice Mode
 * when physical audioinput hardware is missing (preventing "Requested device not found" errors).
 * Handles downsampling to 16kHz PCM16 little-endian Base64 encoding.
 */

export interface StartResult {
  isVirtual: boolean;
  reason?: string;
}

export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private isStreaming: boolean = false;
  private isVirtual: boolean = false;

  private onAudioChunkCallback: ((base64Pcm: string) => void) | null = null;
  private onLevelCallback: ((level: number) => void) | null = null;
  private levelAnimFrame: number | null = null;

  constructor(
    onAudioChunk: (base64Pcm: string) => void,
    onLevel?: (level: number) => void
  ) {
    this.onAudioChunkCallback = onAudioChunk;
    this.onLevelCallback = onLevel || null;
  }

  public async start(): Promise<StartResult> {
    if (this.isStreaming) {
      return { isVirtual: this.isVirtual };
    }

    // 1. Initialize AudioContext
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.audioCtx = new AudioContextClass({ sampleRate: 16000 });
    } catch {
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch {}
    }

    // 2. Resilient microphone hardware acquisition
    let stream: MediaStream | null = null;
    let hardwareError: string | null = null;

    if (navigator?.mediaDevices?.getUserMedia) {
      // First attempt: relaxed audio constraints without rigid channelCount
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err1: any) {
        console.warn('[AudioStreamer] High-spec mic request failed, retrying basic:', err1?.message);
        // Second attempt: basic audio
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err2: any) {
          hardwareError = err2?.message || err1?.message || 'Requested device not found';
          console.warn('[AudioStreamer] Microphone unavailable:', hardwareError);
        }
      }
    } else {
      hardwareError = 'MediaDevices API not supported in this browser environment';
    }

    // 3. Fallback to Virtual Audio Stream if no microphone hardware exists
    if (!stream) {
      console.info('[AudioStreamer] Initializing Virtual Voice Mode (no hardware mic detected).');
      this.isVirtual = true;
      const dest = this.audioCtx.createMediaStreamDestination();
      stream = dest.stream;
    } else {
      this.isVirtual = false;
    }

    this.mediaStream = stream;

    // 4. Connect Web Audio processing graph
    try {
      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.4;
      this.sourceNode.connect(this.analyserNode);

      const bufferSize = 2048;
      this.processorNode = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);

      const inputSampleRate = this.audioCtx.sampleRate;
      const targetSampleRate = 16000;

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isStreaming || this.isMuted || this.isVirtual) return;

        const inputData = e.inputBuffer.getChannelData(0);

        let resampled: Float32Array;
        if (inputSampleRate === targetSampleRate) {
          resampled = inputData;
        } else {
          resampled = this.resample(inputData, inputSampleRate, targetSampleRate);
        }

        const pcm16Buffer = this.floatTo16BitPCM(resampled);
        const base64Audio = this.arrayBufferToBase64(pcm16Buffer);

        if (this.onAudioChunkCallback) {
          this.onAudioChunkCallback(base64Audio);
        }
      };

      this.sourceNode.connect(this.processorNode);

      // Keep script processor active via silent gain
      const silentGain = this.audioCtx.createGain();
      silentGain.gain.value = 0;
      this.processorNode.connect(silentGain);
      silentGain.connect(this.audioCtx.destination);
    } catch (graphErr) {
      console.warn('[AudioStreamer] Web Audio graph warning:', graphErr);
    }

    this.isStreaming = true;
    this.startLevelLoop();

    return {
      isVirtual: this.isVirtual,
      reason: hardwareError || undefined,
    };
  }

  public isVirtualMode(): boolean {
    return this.isVirtual;
  }

  /**
   * Animates mic amplitude waveform when in virtual mode
   */
  public simulateSpeakingAnimation(durationMs: number = 1800): void {
    const startTime = Date.now();
    const anim = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < durationMs && this.isStreaming) {
        const fakeLevel = 0.25 + Math.sin(elapsed * 0.02) * 0.2 + (Math.random() * 0.15);
        if (this.onLevelCallback) this.onLevelCallback(Math.min(1.0, fakeLevel));
        requestAnimationFrame(anim);
      } else {
        if (this.onLevelCallback) this.onLevelCallback(0);
      }
    };
    requestAnimationFrame(anim);
  }

  private startLevelLoop() {
    if (!this.analyserNode) return;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const tick = () => {
      if (!this.isStreaming || !this.analyserNode) return;

      if (this.isMuted || this.isVirtual) {
        // In muted or virtual mode, level remains idle unless simulateSpeakingAnimation is active
      } else {
        this.analyserNode.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const normalized = Math.min(1, rms * 3.5);
        if (this.onLevelCallback) {
          this.onLevelCallback(normalized);
        }
      }

      this.levelAnimFrame = requestAnimationFrame(tick);
    };

    this.levelAnimFrame = requestAnimationFrame(tick);
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.onLevelCallback) {
      this.onLevelCallback(0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public stop(): void {
    this.isStreaming = false;

    if (this.levelAnimFrame) {
      cancelAnimationFrame(this.levelAnimFrame);
      this.levelAnimFrame = null;
    }

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode = null;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {}
      this.analyserNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }

    if (this.onLevelCallback) {
      this.onLevelCallback(0);
    }
  }

  private resample(
    input: Float32Array,
    fromRate: number,
    toRate: number
  ): Float32Array {
    if (fromRate === toRate) return input;
    const ratio = fromRate / toRate;
    const newLength = Math.round(input.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const left = Math.floor(srcIndex);
      const right = Math.min(left + 1, input.length - 1);
      const fraction = srcIndex - left;
      result[i] = input[left] * (1 - fraction) + input[right] * fraction;
    }
    return result;
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(i * 2, val, true);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
