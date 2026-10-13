import { ZaraState, VoiceName, ToolCallItem, UserProfileData } from '../types/zara';
import { AudioStreamer } from './AudioStreamer';
import { AudioPlayer } from './AudioPlayer';
import { ToolManager } from './ToolManager';

export interface LiveSessionCallbacks {
  onStateChange: (state: ZaraState) => void;
  onMicLevel: (level: number) => void;
  onOutputLevel: (level: number) => void;
  onLatencyUpdate: (ms: number) => void;
  onModelReady: (model: string, voice: string) => void;
  onError: (errorMsg: string) => void;
  onToolCallStart?: (item: ToolCallItem) => void;
  onVirtualMode?: (isVirtual: boolean, reason?: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private toolManager: ToolManager;
  private callbacks: LiveSessionCallbacks;

  private currentState: ZaraState = 'disconnected';
  private pingInterval: any = null;
  private currentVoice: VoiceName = 'Aoede';
  private packetsSent: number = 0;
  private packetsReceived: number = 0;
  private isMuted: boolean = false;

  constructor(toolManager: ToolManager, callbacks: LiveSessionCallbacks) {
    this.toolManager = toolManager;
    this.callbacks = callbacks;
  }

  public async connect(voice: VoiceName = 'Aoede', userContext?: UserProfileData): Promise<void> {
    if (this.currentState !== 'disconnected') return;

    this.currentVoice = voice;
    this.setState('connecting');
    this.packetsSent = 0;
    this.packetsReceived = 0;

    try {
      // 1. Initialize AudioPlayer (output 24kHz)
      this.audioPlayer = new AudioPlayer(
        (speaking) => {
          if (this.currentState !== 'disconnected') {
            this.setState(speaking ? 'speaking' : 'listening');
          }
        },
        (amp) => {
          this.callbacks.onOutputLevel(amp);
        }
      );
      await this.audioPlayer.init();

      // 2. Initialize AudioStreamer (input 16kHz)
      this.audioStreamer = new AudioStreamer(
        (base64Pcm) => {
          this.sendAudioChunk(base64Pcm);
        },
        (micLevel) => {
          this.callbacks.onMicLevel(micLevel);
        }
      );
      const streamerResult = await this.audioStreamer.start();
      if (this.isMuted) {
        this.audioStreamer.setMute(true);
      }
      if (this.callbacks.onVirtualMode) {
        this.callbacks.onVirtualMode(streamerResult.isVirtual, streamerResult.reason);
      }

      // 3. Connect WebSocket to /api/live with user context
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(voice)}`;
      if (userContext) {
        wsUrl += `&context=${encodeURIComponent(JSON.stringify(userContext))}`;
      }
      console.log('[LiveSession] Connecting WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[LiveSession] WebSocket connection established');
        this.startPingLoop();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            console.log('[LiveSession] Ready with model:', msg.model);
            this.callbacks.onModelReady(msg.model, msg.voice || voice);
            this.setState('listening');
          } else if (msg.type === 'audio') {
            this.packetsReceived++;
            if (this.audioPlayer && msg.audio) {
              this.audioPlayer.queuePcmChunk(msg.audio);
            }
          } else if (msg.type === 'interrupted') {
            console.log('[LiveSession] Model detected user interruption');
            if (this.audioPlayer) {
              this.audioPlayer.interrupt();
            }
            this.setState('listening');
          } else if (msg.type === 'turn_complete') {
            // Handled automatically by audio queue clearance, but mark fallback
            if (!this.audioPlayer?.getIsPlaying()) {
              this.setState('listening');
            }
          } else if (msg.type === 'tool_call') {
            await this.handleToolCalls(msg.functionCalls);
          } else if (msg.type === 'pong') {
            const rtt = Date.now() - msg.timestamp;
            this.callbacks.onLatencyUpdate(rtt);
          } else if (msg.type === 'error') {
            console.error('[LiveSession] Upstream error:', msg.message);
            this.callbacks.onError(msg.message);
            this.disconnect();
          } else if (msg.type === 'closed') {
            this.disconnect();
          }
        } catch (err) {
          console.error('[LiveSession] Error handling message:', err);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[LiveSession] WebSocket error:', e);
        this.callbacks.onError('Connection error to voice server.');
        this.disconnect();
      };

      this.ws.onclose = () => {
        console.log('[LiveSession] WebSocket closed');
        this.disconnect();
      };
    } catch (err: any) {
      console.error('[LiveSession] Failed to connect:', err);
      this.callbacks.onError(err?.message || 'Microphone access or server connection failed.');
      this.disconnect();
    }
  }

  private sendAudioChunk(base64: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.packetsSent++;
      this.ws.send(
        JSON.stringify({
          type: 'audio',
          audio: base64,
        })
      );
    }
  }

  private async handleToolCalls(functionCalls: Array<{ id: string; name: string; args: any }>): Promise<void> {
    const responses: Array<{ id: string; name: string; response: Record<string, any> }> = [];

    for (const fc of functionCalls) {
      const toolItem: ToolCallItem = {
        id: fc.id || `call_${Date.now()}`,
        name: fc.name,
        args: fc.args || {},
        timestamp: Date.now(),
        status: 'pending',
      };
      if (this.callbacks.onToolCallStart) {
        this.callbacks.onToolCallStart(toolItem);
      }

      try {
        const result = await this.toolManager.executeToolCall(fc.name, fc.args || {});
        responses.push({
          id: fc.id,
          name: fc.name,
          response: result,
        });
      } catch (err: any) {
        responses.push({
          id: fc.id,
          name: fc.name,
          response: { status: 'error', error: err?.message || 'Tool execution failed' },
        });
      }
    }

    // Send tool responses back to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'tool_response',
          functionResponses: responses,
        })
      );
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.audioStreamer) {
      this.audioStreamer.setMute(muted);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public isVirtual(): boolean {
    return this.audioStreamer ? this.audioStreamer.isVirtualMode() : false;
  }

  public sendPrompt(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.audioStreamer) {
        this.audioStreamer.simulateSpeakingAnimation(1800);
      }
      this.ws.send(JSON.stringify({ type: 'text', text }));
    }
  }

  public sendQuickAction(prompt: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.audioStreamer) {
        this.audioStreamer.simulateSpeakingAnimation(1800);
      }
      this.ws.send(JSON.stringify({ type: 'quick_action', prompt }));
    }
  }

  public sendVisualFrame(base64Jpeg: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'video_frame',
          data: base64Jpeg,
          mimeType: 'image/jpeg',
        })
      );
    }
  }

  public notifyScreenShare(active: boolean, initialInstruction?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const text = active
        ? `[User screen share is now ACTIVE]: Zara, you are now receiving live frames of the user's screen. ${initialInstruction || 'Please observe the screen and share your thoughts or answer questions about what you see naturally.'}`
        : `[User stopped sharing their screen].`;
      this.sendPrompt(text);
    }
  }

  public disconnect(): void {
    if (this.currentState === 'disconnected') return;

    this.stopPingLoop();

    if (this.audioStreamer) {
      this.audioStreamer.stop();
      this.audioStreamer = null;
    }

    if (this.audioPlayer) {
      this.audioPlayer.stop();
      this.audioPlayer = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch {}
      this.ws = null;
    }

    this.setState('disconnected');
    this.callbacks.onMicLevel(0);
    this.callbacks.onOutputLevel(0);
  }

  private setState(state: ZaraState) {
    if (this.currentState !== state) {
      this.currentState = state;
      this.callbacks.onStateChange(state);
    }
  }

  public getState(): ZaraState {
    return this.currentState;
  }

  public getPacketsCount(): { sent: number; received: number } {
    return { sent: this.packetsSent, received: this.packetsReceived };
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 4000);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
