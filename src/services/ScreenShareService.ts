/**
 * ScreenShareService
 * Manages screen capture stream and periodic JPEG frame extraction
 * for real-time visual streaming to Gemini Live.
 */

export interface ScreenShareCallbacks {
  onFrame: (base64Jpeg: string) => void;
  onStateChange: (isActive: boolean) => void;
  onStatsUpdate: (resolution: string, fps: number, frameCount: number) => void;
  onError: (errorMsg: string) => void;
}

export class ScreenShareService {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private captureInterval: any = null;
  private callbacks: ScreenShareCallbacks;
  private frameCount: number = 0;
  private isCapturing: boolean = false;

  constructor(callbacks: ScreenShareCallbacks) {
    this.callbacks = callbacks;
  }

  public async start(): Promise<boolean> {
    if (this.isCapturing) return true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      this.callbacks.onError('Screen capture is not supported in this browser environment.');
      return false;
    }

    try {
      // Request screen stream with cursor
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          // @ts-ignore
          cursor: 'always',
        },
        audio: false,
      });

      this.stream = stream;
      this.frameCount = 0;

      // Listen for user stopping share via browser floating controls
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stop();
        };
      }

      // Hidden video element to read video dimensions and draw onto canvas
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      this.videoEl = video;

      // Setup offscreen canvas
      const canvas = document.createElement('canvas');
      this.canvasEl = canvas;

      this.isCapturing = true;
      this.callbacks.onStateChange(true);

      // Capture frames every 1.5 seconds (balanced for Gemini Live vision ingestion)
      this.captureInterval = setInterval(() => {
        this.captureFrame();
      }, 1500);

      // Immediate first frame
      setTimeout(() => this.captureFrame(), 300);

      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        console.log('[ScreenShare] User canceled screen share prompt');
      } else {
        console.error('[ScreenShare] Error starting screen capture:', err);
        this.callbacks.onError(err.message || 'Could not start screen sharing');
      }
      this.stop();
      return false;
    }
  }

  public captureFrame(): string | null {
    if (!this.videoEl || !this.canvasEl || !this.stream || !this.isCapturing) return null;

    const video = this.videoEl;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = this.canvasEl;
    // Scale down to max 768px dimension while preserving aspect ratio
    const maxWidth = 768;
    const maxHeight = 768;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);

    // High performance JPEG with 0.72 quality
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    const base64 = dataUrl.split(',')[1];

    if (base64) {
      this.frameCount++;
      this.callbacks.onFrame(base64);
      this.callbacks.onStatsUpdate(
        `${video.videoWidth}x${video.videoHeight}`,
        Math.round(1000 / 1500 * 10) / 10,
        this.frameCount
      );
      return dataUrl;
    }
    return null;
  }

  public stop(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.stream = null;
    }

    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl = null;
    }

    this.canvasEl = null;

    if (this.isCapturing) {
      this.isCapturing = false;
      this.callbacks.onStateChange(false);
    }
  }

  public getIsActive(): boolean {
    return this.isCapturing;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }
}
