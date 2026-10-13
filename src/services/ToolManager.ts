import { AtmosphereSound, GlowTheme, WebsiteAction, ActiveTimer, ScheduleItem, AppId, MediaType } from '../types/zara';
import { UserDataStore } from './UserDataStore';

export interface ToolExecutionHandlers {
  onWebsiteOpened: (action: WebsiteAction) => void;
  onTimerCreated: (timer: ActiveTimer) => void;
  onAtmosphereChanged: (sound: AtmosphereSound) => void;
  onGlowThemeChanged: (theme: GlowTheme) => void;
  onScheduleUpdated?: (schedule: ScheduleItem[]) => void;
  onMemoryNotesUpdated?: (notes: string[]) => void;
  onOpenApp?: (appId: AppId, reason?: string) => void;
  onCloseApp?: (appId: AppId | 'all') => void;
  onControlApp?: (appId: AppId, action: string, payload?: string) => void;
  onGeneratePhoto?: (prompt: string, aspectRatio?: string) => Promise<any>;
  onGenerateVideo?: (prompt: string, aspectRatio?: string) => Promise<any>;
  onSeeUserScreen?: (instruction?: string) => Promise<any>;
}

export class ToolManager {
  private handlers: ToolExecutionHandlers;
  private ambientAudioCtx: AudioContext | null = null;
  private ambientSourceNodes: {
    oscillators?: OscillatorNode[];
    gains?: GainNode[];
    filters?: BiquadFilterNode[];
    bufferSource?: AudioBufferSourceNode;
  } = {};
  private currentAtmosphere: AtmosphereSound = 'off';

  constructor(handlers: ToolExecutionHandlers) {
    this.handlers = handlers;
  }

  public async executeToolCall(name: string, args: Record<string, any>): Promise<Record<string, any>> {
    console.log(`[ToolManager] Executing ${name}:`, args);

    switch (name) {
      case 'openWebsite': {
        const rawUrl = String(args.url || '').trim();
        const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
        const title = String(args.title || 'Web Link');
        const reason = args.reason ? String(args.reason) : undefined;

        const action: WebsiteAction = {
          id: `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url,
          title,
          reason,
          timestamp: Date.now(),
        };

        // Notify UI to render rich link card
        this.handlers.onWebsiteOpened(action);

        // Attempt popup in new tab safely
        try {
          const opened = window.open(url, '_blank', 'noopener,noreferrer');
          if (!opened) {
            console.log('[ToolManager] Popup prevented by browser policy; card displayed.');
          }
        } catch {
          // Ignored if restricted in sandbox iframe
        }

        return {
          status: 'success',
          action: 'open_website',
          title,
          url,
          message: `Website "${title}" card displayed and link ready for user.`,
        };
      }

      case 'searchWeb': {
        const query = String(args.query || '').trim();
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const action: WebsiteAction = {
          id: `search_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          url,
          title: `Search: "${query}"`,
          reason: `Search results for ${query}`,
          timestamp: Date.now(),
        };

        this.handlers.onWebsiteOpened(action);

        return {
          status: 'success',
          action: 'search_web',
          query,
          url,
          message: `Search query "${query}" executed and link card created.`,
        };
      }

      case 'setTimer': {
        const durationSeconds = Math.max(1, Number(args.durationSeconds) || 60);
        const label = String(args.label || 'Timer');

        const timer: ActiveTimer = {
          id: `timer_${Date.now()}`,
          label,
          totalSeconds: durationSeconds,
          remainingSeconds: durationSeconds,
          isRunning: true,
        };

        this.handlers.onTimerCreated(timer);

        return {
          status: 'success',
          action: 'timer_started',
          label,
          durationSeconds,
          message: `Timer "${label}" set for ${durationSeconds} seconds.`,
        };
      }

      case 'playAtmosphereSound': {
        const sound = (args.sound as AtmosphereSound) || 'off';
        const validSounds: AtmosphereSound[] = ['rain', 'cyberpunk_lofi', 'cafe', 'deep_space', 'off'];
        const target = validSounds.includes(sound) ? sound : 'off';

        this.setAtmosphereSound(target);
        this.handlers.onAtmosphereChanged(target);

        return {
          status: 'success',
          atmosphere: target,
          state: target === 'off' ? 'stopped' : 'playing',
          message: `Ambient audio set to ${target}.`,
        };
      }

      case 'changeMoodGlow': {
        const glowTheme = (args.glowTheme as GlowTheme) || 'violet_neon';
        const validThemes: GlowTheme[] = ['violet_neon', 'cyan_pulse', 'amber_gold', 'emerald_zen', 'crimson_flame'];
        const chosen = validThemes.includes(glowTheme) ? glowTheme : 'violet_neon';

        this.handlers.onGlowThemeChanged(chosen);

        return {
          status: 'success',
          theme: chosen,
          message: `Aura theme shifted to ${chosen}.`,
        };
      }

      case 'addToSchedule': {
        const task = String(args.task || 'Untitled Task');
        const time = args.time ? String(args.time) : 'Today';
        const priority = args.priority === 'high' || args.priority === 'low' ? args.priority : 'normal';
        UserDataStore.addScheduleItem(task, time, priority);
        if (this.handlers.onScheduleUpdated) {
          this.handlers.onScheduleUpdated(UserDataStore.getUserData().schedule);
        }
        return {
          status: 'success',
          action: 'add_to_schedule',
          task,
          time,
          priority,
          message: `Added task "${task}" at ${time} to user schedule.`,
        };
      }

      case 'saveUserNote': {
        const note = String(args.note || '').trim();
        if (note) {
          UserDataStore.addMemoryNote(note);
          if (this.handlers.onMemoryNotesUpdated) {
            this.handlers.onMemoryNotesUpdated(UserDataStore.getUserData().memoryNotes);
          }
        }
        return {
          status: 'success',
          action: 'save_user_note',
          note,
          message: `Saved memory note: "${note}".`,
        };
      }

      case 'getUserContext': {
        const profile = UserDataStore.getUserData();
        return {
          status: 'success',
          name: profile.name,
          role: profile.role,
          schedule: profile.schedule,
          memoryNotes: profile.memoryNotes,
          lastSessionSummary: profile.lastSessionSummary,
        };
      }

      case 'getDeviceInfo': {
        const now = new Date();
        return {
          status: 'success',
          localTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          date: now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          batterySupported: 'getBattery' in navigator,
        };
      }

      case 'openApp': {
        const rawApp = String(args.appName || 'media_studio').toLowerCase();
        let appId: AppId = 'media_studio';
        if (rawApp.includes('screen') || rawApp.includes('vision')) appId = 'screen_vision';
        else if (rawApp.includes('note') || rawApp.includes('memo')) appId = 'notes';
        else if (rawApp.includes('sound') || rawApp.includes('music') || rawApp.includes('audio')) appId = 'soundboard';
        else if (rawApp.includes('sched') || rawApp.includes('task') || rawApp.includes('agenda')) appId = 'schedule';
        else if (rawApp.includes('browse') || rawApp.includes('web')) appId = 'browser';
        else if (rawApp.includes('diag') || rawApp.includes('metric') || rawApp.includes('system')) appId = 'diagnostics';
        else appId = 'media_studio';

        const reason = args.reason ? String(args.reason) : 'User or voice request';
        if (this.handlers.onOpenApp) {
          this.handlers.onOpenApp(appId, reason);
        }
        return {
          status: 'success',
          action: 'open_app',
          appId,
          message: `Application "${appId}" window opened successfully for the user.`,
        };
      }

      case 'closeApp': {
        const rawApp = String(args.appName || 'all').toLowerCase();
        let appId: AppId | 'all' = 'all';
        if (rawApp === 'all') appId = 'all';
        else if (rawApp.includes('screen')) appId = 'screen_vision';
        else if (rawApp.includes('note')) appId = 'notes';
        else if (rawApp.includes('sound')) appId = 'soundboard';
        else if (rawApp.includes('sched')) appId = 'schedule';
        else if (rawApp.includes('browse')) appId = 'browser';
        else if (rawApp.includes('diag')) appId = 'diagnostics';
        else if (rawApp.includes('media') || rawApp.includes('photo') || rawApp.includes('video')) appId = 'media_studio';

        if (this.handlers.onCloseApp) {
          this.handlers.onCloseApp(appId);
        }
        return {
          status: 'success',
          action: 'close_app',
          appId,
          message: `Application "${appId}" window closed.`,
        };
      }

      case 'controlApp': {
        const appName = String(args.appName || 'media_studio').toLowerCase() as AppId;
        const action = String(args.action || 'trigger');
        const payload = args.payload ? String(args.payload) : undefined;
        if (this.handlers.onControlApp) {
          this.handlers.onControlApp(appName, action, payload);
        }
        return {
          status: 'success',
          action: 'control_app',
          appName,
          executedAction: action,
          message: `Action "${action}" sent to ${appName}.`,
        };
      }

      case 'generatePhoto': {
        const prompt = String(args.prompt || 'Futuristic glowing artwork');
        const aspectRatio = String(args.aspectRatio || '1:1');
        let result: any = null;
        if (this.handlers.onGeneratePhoto) {
          result = await this.handlers.onGeneratePhoto(prompt, aspectRatio);
        }
        return {
          status: 'success',
          action: 'generate_photo',
          prompt,
          aspectRatio,
          message: `Photo generated for "${prompt}" and opened in dedicated Separate Result Window!`,
          mediaItem: result,
        };
      }

      case 'generateVideo': {
        const prompt = String(args.prompt || 'Cinematic neon kinetic flow');
        const aspectRatio = String(args.aspectRatio || '16:9');
        let result: any = null;
        if (this.handlers.onGenerateVideo) {
          result = await this.handlers.onGenerateVideo(prompt, aspectRatio);
        }
        return {
          status: 'success',
          action: 'generate_video',
          prompt,
          aspectRatio,
          message: `Video generated for "${prompt}" and opened in dedicated Separate Result Window with video player!`,
          mediaItem: result,
        };
      }

      case 'seeUserScreen': {
        const instruction = args.instruction ? String(args.instruction) : 'Examine user screen';
        if (this.handlers.onSeeUserScreen) {
          await this.handlers.onSeeUserScreen(instruction);
        }
        return {
          status: 'success',
          action: 'see_user_screen',
          message: 'Screen vision requested and active. Live screen frames are streaming to your vision pipeline.',
        };
      }

      default:
        console.warn(`[ToolManager] Unknown tool call: ${name}`);
        return {
          status: 'error',
          message: `Tool ${name} is not implemented.`,
        };
    }
  }

  /**
   * Procedural Web Audio Ambient Sound Generator
   */
  public setAtmosphereSound(sound: AtmosphereSound): void {
    this.stopAtmosphere();
    this.currentAtmosphere = sound;

    if (sound === 'off') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ambientAudioCtx = new AudioContextClass();

      const ctx = this.ambientAudioCtx;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.25;
      masterGain.connect(ctx.destination);

      if (sound === 'rain') {
        // Procedural Pink Noise Rain Generator
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        this.ambientSourceNodes.bufferSource = whiteNoise;
      } else if (sound === 'deep_space') {
        // Deep Space Sub-Harmonic Drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 55; // A1
        osc2.type = 'triangle';
        osc2.frequency.value = 82.4; // E2

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 220;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start();
        osc2.start();

        this.ambientSourceNodes.oscillators = [osc1, osc2];
      } else if (sound === 'cyberpunk_lofi') {
        // Lush Neo Lofi Pad (Cm9 Chord)
        const freqs = [130.81, 155.56, 196.0, 233.08]; // C3, Eb3, G3, Bb3
        const oscs: OscillatorNode[] = [];
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 550;

        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = f;
          const oscGain = ctx.createGain();
          oscGain.gain.value = 0.05;
          osc.connect(oscGain);
          oscGain.connect(filter);
          osc.start();
          oscs.push(osc);
        });

        filter.connect(masterGain);
        this.ambientSourceNodes.oscillators = oscs;
      } else if (sound === 'cafe') {
        // Warm Coffee Shop Ambience Drone
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 110;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 450;
        filter.Q.value = 1.2;

        osc1.connect(filter);
        filter.connect(masterGain);
        osc1.start();

        this.ambientSourceNodes.oscillators = [osc1];
      }
    } catch (err) {
      console.warn('[ToolManager] Error starting ambient sound:', err);
    }
  }

  public stopAtmosphere(): void {
    if (this.ambientSourceNodes.bufferSource) {
      try {
        this.ambientSourceNodes.bufferSource.stop();
        this.ambientSourceNodes.bufferSource.disconnect();
      } catch {}
      this.ambientSourceNodes.bufferSource = undefined;
    }

    if (this.ambientSourceNodes.oscillators) {
      this.ambientSourceNodes.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.ambientSourceNodes.oscillators = undefined;
    }

    if (this.ambientAudioCtx) {
      try {
        this.ambientAudioCtx.close();
      } catch {}
      this.ambientAudioCtx = null;
    }

    this.currentAtmosphere = 'off';
  }

  public getCurrentAtmosphere(): AtmosphereSound {
    return this.currentAtmosphere;
  }
}
