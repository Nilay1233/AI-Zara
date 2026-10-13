/**
 * Zara AI Assistant
 * Real-time, voice-to-voice AI companion web app powered by Gemini Live API.
 * Supports 6 Distinctive UIs (Classic Old UI and 5 Next-Gen New UIs with Motion).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Settings,
  Radio,
  Volume2,
  Mic,
  MicOff,
  Power,
  Flame,
  Info,
  Clock,
  ExternalLink,
  History,
  Zap,
  CheckCircle2,
  Monitor,
  Eye,
  Layers,
} from 'lucide-react';

import {
  ZaraState,
  VoiceName,
  GlowTheme,
  AtmosphereSound,
  WebsiteAction,
  ActiveTimer,
  ToolCallItem,
  SessionMetrics,
  SessionLogEntry,
  SessionToolEvent,
  UIMode,
  AppId,
  AppWindowConfig,
  GeneratedMediaItem,
  MediaType,
  ScreenShareState,
} from './types/zara';

import { UI_MODES_LIST } from './config/uiModes';
import { ToolManager } from './services/ToolManager';
import { LiveSession } from './services/LiveSession';
import { SessionLogger } from './services/SessionLogger';
import { UserDataStore } from './services/UserDataStore';
import { ScreenShareService } from './services/ScreenShareService';
import { MediaGeneratorService } from './services/MediaGeneratorService';
import { ZaraOrb } from './components/ZaraOrb';
import { WaveformCanvas } from './components/WaveformCanvas';
import { ToolActivityPanel } from './components/ToolActivityPanel';
import { ConversationStarters } from './components/ConversationStarters';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { SessionLogModal } from './components/SessionLogModal';
import { UIModeButton } from './components/UIModeButton';
import { UISelectionModal } from './components/UISelectionModal';
import { ModernNewUI } from './components/ModernNewUI';
import { QuickActionsSidebar } from './components/QuickActionsSidebar';
import { MuteButton } from './components/MuteButton';
import { WindowManager } from './components/WindowManager';
import { MediaResultModal } from './components/MediaResultModal';

export default function App() {
  const [state, setState] = useState<ZaraState>('disconnected');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Aoede');
  const [glowTheme, setGlowTheme] = useState<GlowTheme>('violet_neon');
  const [currentAtmosphere, setCurrentAtmosphere] = useState<AtmosphereSound>('off');
  const [isVirtualMode, setIsVirtualMode] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // 6 UIs State
  const [uiMode, setUiMode] = useState<UIMode>(() => {
    try {
      const saved = localStorage.getItem('zara_ui_mode_v2') as UIMode;
      return saved || 'hologram';
    } catch {
      return 'hologram';
    }
  });
  const [isUIGalleryOpen, setIsUIGalleryOpen] = useState<boolean>(false);

  const handleSetUiMode = (newMode: UIMode) => {
    setUiMode(newMode);
    try {
      localStorage.setItem('zara_ui_mode_v2', newMode);
    } catch {}
  };

  const handleCycleNextUI = () => {
    const currentIndex = UI_MODES_LIST.findIndex((m) => m.id === uiMode);
    const nextIndex = (currentIndex + 1) % UI_MODES_LIST.length;
    handleSetUiMode(UI_MODES_LIST[nextIndex].id);
  };

  // Tools state
  const [websites, setWebsites] = useState<WebsiteAction[]>([]);
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Virtual Apps Management State
  const [openApps, setOpenApps] = useState<Record<AppId, AppWindowConfig>>({
    media_studio: { id: 'media_studio', title: 'Media Studio', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 40 },
    screen_vision: { id: 'screen_vision', title: 'Screen Vision HUD', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 40 },
    notes: { id: 'notes', title: 'Notes & Memory Bank', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 40 },
    soundboard: { id: 'soundboard', title: 'Atmosphere Soundboard', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 40 },
    schedule: { id: 'schedule', title: 'Daily Schedule', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 40 },
    browser: { id: 'browser', title: 'Web Explorer', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 40 },
    diagnostics: { id: 'diagnostics', title: 'System Diagnostics', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 40 },
  });
  const [activeAppId, setActiveAppId] = useState<AppId | null>(null);
  const nextZIndexRef = useRef<number>(50);

  // Separate Media Result Window State
  const [selectedMediaResult, setSelectedMediaResult] = useState<GeneratedMediaItem | null>(null);
  const [isMediaResultOpen, setIsMediaResultOpen] = useState<boolean>(false);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState<boolean>(false);
  const [mediaHistory, setMediaHistory] = useState<GeneratedMediaItem[]>([]);

  // Screen Share & Vision State
  const screenShareServiceRef = useRef<ScreenShareService | null>(null);
  const [screenState, setScreenState] = useState<ScreenShareState>({
    isActive: false,
    resolution: '',
    fps: 0,
    lastFrameTimestamp: 0,
    frameCount: 0,
    isAnalyzing: false,
  });

  // Metrics & Journal logs
  const [sessionLogs, setSessionLogs] = useState<SessionLogEntry[]>(() => SessionLogger.getLogs());
  const [metrics, setMetrics] = useState<SessionMetrics>({
    latencyMs: 0,
    sessionDuration: 0,
    activeModel: 'gemini-3.1-flash-live-preview',
    audioPacketsSent: 0,
    audioPacketsReceived: 0,
  });

  const liveSessionRef = useRef<LiveSession | null>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);
  const sessionTimerRef = useRef<any>(null);
  const pendingPromptRef = useRef<string | null>(null);

  // Active session telemetry tracking
  const currentSessionToolsRef = useRef<SessionToolEvent[]>([]);
  const currentSessionStartTimeRef = useRef<number>(0);
  const currentTurnCountRef = useRef<number>(0);
  const appActionsRef = useRef<{
    openApp: (appId: AppId, reason?: string) => void;
    closeApp: (appId: AppId | 'all') => void;
    controlApp: (appId: AppId, action: string, payload?: string) => void;
    generatePhoto: (prompt: string, aspectRatio?: string) => Promise<any>;
    generateVideo: (prompt: string, aspectRatio?: string) => Promise<any>;
    seeUserScreen: (instruction?: string) => Promise<any>;
  }>({
    openApp: () => {},
    closeApp: () => {},
    controlApp: () => {},
    generatePhoto: async () => {},
    generateVideo: async () => {},
    seeUserScreen: async () => {},
  });

  // Initialize ToolManager
  useEffect(() => {
    const tm = new ToolManager({
      onWebsiteOpened: (action) => {
        setWebsites((prev) => [action, ...prev.slice(0, 4)]);
        currentSessionToolsRef.current.push({
          name: 'openWebsite',
          label: action.title,
          detail: action.reason || action.url,
          timestamp: Date.now(),
        });
      },
      onTimerCreated: (timer) => {
        setTimers((prev) => [timer, ...prev.filter((t) => t.id !== timer.id)]);
        currentSessionToolsRef.current.push({
          name: 'setTimer',
          label: timer.label,
          detail: `${Math.round(timer.totalSeconds / 60)}m countdown`,
          timestamp: Date.now(),
        });
      },
      onAtmosphereChanged: (sound) => {
        setCurrentAtmosphere(sound);
        if (sound !== 'off') {
          currentSessionToolsRef.current.push({
            name: 'playAtmosphereSound',
            label: sound.replace('_', ' '),
            detail: 'Ambient audio active',
            timestamp: Date.now(),
          });
        }
      },
      onGlowThemeChanged: (theme) => {
        setGlowTheme(theme);
        currentSessionToolsRef.current.push({
          name: 'changeMoodGlow',
          label: theme.replace('_', ' '),
          detail: 'Visual theme shifted',
          timestamp: Date.now(),
        });
      },
      onScheduleUpdated: () => {
        setToastNotification('Daily schedule updated by Zara!');
        setTimeout(() => setToastNotification(null), 3500);
      },
      onMemoryNotesUpdated: () => {
        setToastNotification('Zara remembered a new note about you!');
        setTimeout(() => setToastNotification(null), 3500);
      },
      onOpenApp: (appId, reason) => {
        appActionsRef.current.openApp(appId, reason);
      },
      onCloseApp: (appId) => {
        appActionsRef.current.closeApp(appId);
      },
      onControlApp: (appId, action, payload) => {
        appActionsRef.current.controlApp(appId, action, payload);
      },
      onGeneratePhoto: async (prompt, aspectRatio) => {
        return await appActionsRef.current.generatePhoto(prompt, aspectRatio);
      },
      onGenerateVideo: async (prompt, aspectRatio) => {
        return await appActionsRef.current.generateVideo(prompt, aspectRatio);
      },
      onSeeUserScreen: async (instruction) => {
        return await appActionsRef.current.seeUserScreen(instruction);
      },
    });
    toolManagerRef.current = tm;

    return () => {
      tm.stopAtmosphere();
    };
  }, []);

  // Finalize and record completed session into visual log and user data memory
  const recordSession = useCallback(() => {
    if (currentSessionStartTimeRef.current === 0) return;
    const duration = Math.round((Date.now() - currentSessionStartTimeRef.current) / 1000);
    if (duration >= 3) {
      const newEntry: SessionLogEntry = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        startTime: currentSessionStartTimeRef.current,
        endTime: Date.now(),
        durationSeconds: duration,
        voiceName: selectedVoice,
        turnCount: Math.max(1, currentTurnCountRef.current),
        toolsTriggered: [...currentSessionToolsRef.current],
        vibe:
          currentSessionToolsRef.current.length > 1
            ? 'Curious & Smart'
            : duration > 90
            ? 'Relaxed Focus'
            : 'Playful & Witty',
      };
      SessionLogger.addLog(newEntry);
      setSessionLogs(SessionLogger.getLogs());

      // Update UserDataStore lastSessionSummary for human-like conversational memory
      const userData = UserDataStore.getUserData();
      const toolsSummary = currentSessionToolsRef.current.map((t) => t.label).join(', ');
      const newSummary = toolsSummary
        ? `In recent session (${duration}s), ${userData.name} and Zara spoke and triggered tools: ${toolsSummary}.`
        : `In recent session (${duration}s), ${userData.name} had a warm, natural conversation with Zara using ${selectedVoice} voice.`;
      UserDataStore.updateLastSessionSummary(newSummary);
    }
    currentSessionStartTimeRef.current = 0;
    currentSessionToolsRef.current = [];
    currentTurnCountRef.current = 0;
  }, [selectedVoice]);

  // Session duration timer
  useEffect(() => {
    if (state !== 'disconnected') {
      sessionTimerRef.current = setInterval(() => {
        setMetrics((prev) => ({
          ...prev,
          sessionDuration: prev.sessionDuration + 1,
        }));
      }, 1000);
    } else {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      setMetrics((prev) => ({ ...prev, sessionDuration: 0 }));
    }

    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [state]);

  // Connect or disconnect session
  const handleToggleConnect = useCallback(async () => {
    if (state !== 'disconnected') {
      recordSession();
      if (liveSessionRef.current) {
        liveSessionRef.current.disconnect();
      }
      return;
    }

    if (!toolManagerRef.current) return;

    setErrorMessage(null);
    currentSessionStartTimeRef.current = Date.now();
    currentSessionToolsRef.current = [];
    currentTurnCountRef.current = 0;

    const userData = UserDataStore.getUserData();

    const session = new LiveSession(toolManagerRef.current, {
      onStateChange: (newState) => {
        setState(newState);
        if (newState === 'speaking') {
          currentTurnCountRef.current += 1;
        }
        if (newState === 'listening' && pendingPromptRef.current) {
          const p = pendingPromptRef.current;
          pendingPromptRef.current = null;
          setTimeout(() => {
            session.sendQuickAction(p);
          }, 300);
        }
        if (newState === 'disconnected') {
          recordSession();
        }
      },
      onMicLevel: (lvl) => {
        setMicLevel(lvl);
      },
      onOutputLevel: (lvl) => {
        setOutputLevel(lvl);
      },
      onLatencyUpdate: (ms) => {
        setMetrics((prev) => ({ ...prev, latencyMs: ms }));
      },
      onModelReady: (model, voice) => {
        setMetrics((prev) => ({
          ...prev,
          activeModel: model,
        }));
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onToolCallStart: (_item) => {
        // Handled via toolManager callbacks
      },
      onVirtualMode: (isVirtual) => {
        setIsVirtualMode(isVirtual);
      },
    });

    liveSessionRef.current = session;
    if (isMuted) {
      session.setMute(true);
    }
    await session.connect(selectedVoice, userData);
  }, [state, selectedVoice, recordSession, isMuted]);

  // Trigger quick action with single click
  const handleTriggerQuickAction = useCallback((prompt: string, title?: string) => {
    if (title) {
      setToastNotification(`Triggered: ${title}`);
      setTimeout(() => setToastNotification(null), 2500);
    }
    if (state === 'disconnected') {
      pendingPromptRef.current = prompt;
      handleToggleConnect();
    } else {
      if (liveSessionRef.current) {
        liveSessionRef.current.sendQuickAction(prompt);
      }
    }
  }, [state, handleToggleConnect]);

  // Toggle microphone mute
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (liveSessionRef.current) {
        liveSessionRef.current.setMute(nextMuted);
      }
      return nextMuted;
    });
  }, []);

  // Dismiss website card
  const handleDismissWebsite = useCallback((id: string) => {
    setWebsites((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // Dismiss timer
  const handleDismissTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Atmosphere sound control
  const handleChangeAtmosphere = useCallback((sound: AtmosphereSound) => {
    if (toolManagerRef.current) {
      toolManagerRef.current.setAtmosphereSound(sound);
      setCurrentAtmosphere(sound);
    }
  }, []);

  // Voice change
  const handleSelectVoice = useCallback((voice: VoiceName) => {
    setSelectedVoice(voice);
  }, []);

  // Virtual Apps Management Handlers
  const handleOpenApp = useCallback((appId: AppId, initialData?: any) => {
    nextZIndexRef.current += 1;
    setOpenApps((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        isOpen: true,
        isMinimized: false,
        zIndex: nextZIndexRef.current,
        initialData,
      },
    }));
    setActiveAppId(appId);
    setToastNotification(`Opened app: ${appId.replace('_', ' ')}`);
    setTimeout(() => setToastNotification(null), 2500);
  }, []);

  const handleCloseApp = useCallback((appId: AppId | 'all') => {
    if (appId === 'all') {
      setOpenApps((prev) => {
        const next = { ...prev };
        (Object.keys(next) as AppId[]).forEach((k) => {
          next[k] = { ...next[k], isOpen: false };
        });
        return next;
      });
      setActiveAppId(null);
      setToastNotification('Closed all app windows');
      setTimeout(() => setToastNotification(null), 2000);
      return;
    }

    setOpenApps((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], isOpen: false },
    }));
    setActiveAppId((prev) => (prev === appId ? null : prev));
  }, []);

  const handleMinimizeApp = useCallback((appId: AppId) => {
    setOpenApps((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], isMinimized: !prev[appId].isMinimized },
    }));
  }, []);

  const handleMaximizeApp = useCallback((appId: AppId) => {
    setOpenApps((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], isMaximized: !prev[appId].isMaximized },
    }));
  }, []);

  const handleFocusApp = useCallback((appId: AppId) => {
    nextZIndexRef.current += 1;
    setOpenApps((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], zIndex: nextZIndexRef.current, isMinimized: false },
    }));
    setActiveAppId(appId);
  }, []);

  const handleCloseAllApps = useCallback(() => {
    handleCloseApp('all');
  }, [handleCloseApp]);

  // Media Generation Handlers
  const handleGenerateMedia = useCallback(
    async (prompt: string, type: MediaType = 'image', aspectRatio: string = '1:1') => {
      setIsGeneratingMedia(true);
      setToastNotification(`Generating AI ${type === 'video' ? 'Video' : 'Photo'}...`);

      try {
        let result: GeneratedMediaItem;
        if (type === 'video') {
          result = await MediaGeneratorService.generateVideo(prompt, aspectRatio);
        } else {
          result = await MediaGeneratorService.generatePhoto(prompt, aspectRatio);
        }

        setMediaHistory((prev) => [result, ...prev.slice(0, 19)]);
        setSelectedMediaResult(result);
        setIsMediaResultOpen(true);
        setToastNotification(`AI ${type === 'video' ? 'Video' : 'Photo'} Ready! Separate Window Opened.`);
        setTimeout(() => setToastNotification(null), 4000);

        return result;
      } catch (err: any) {
        console.error('Error generating media:', err);
        setErrorMessage(`Generation error: ${err.message || 'Failed'}`);
      } finally {
        setIsGeneratingMedia(false);
      }
    },
    []
  );

  const handleOpenMediaResult = useCallback((item: GeneratedMediaItem) => {
    setSelectedMediaResult(item);
    setIsMediaResultOpen(true);
  }, []);

  // Screen Sharing Handlers
  const handleToggleScreenShare = useCallback(async () => {
    if (screenState.isActive) {
      if (screenShareServiceRef.current) {
        screenShareServiceRef.current.stop();
      }
      setScreenState((prev) => ({ ...prev, isActive: false }));
      if (liveSessionRef.current) {
        liveSessionRef.current.notifyScreenShare(false);
      }
      setToastNotification('Screen sharing ended');
      setTimeout(() => setToastNotification(null), 2500);
      return;
    }

    if (!screenShareServiceRef.current) {
      screenShareServiceRef.current = new ScreenShareService({
        onFrame: (base64Jpeg) => {
          if (liveSessionRef.current) {
            liveSessionRef.current.sendVisualFrame(base64Jpeg);
          }
          setScreenState((prev) => ({
            ...prev,
            lastFrameTimestamp: Date.now(),
            frameCount: prev.frameCount + 1,
          }));
        },
        onStateChange: (isActive) => {
          setScreenState((prev) => ({ ...prev, isActive }));
          if (liveSessionRef.current) {
            liveSessionRef.current.notifyScreenShare(isActive);
          }
        },
        onStatsUpdate: (resolution, fps, frameCount) => {
          setScreenState((prev) => ({ ...prev, resolution, fps, frameCount }));
        },
        onError: (err) => {
          setErrorMessage(err);
        },
      });
    }

    const started = await screenShareServiceRef.current.start();
    if (started) {
      handleOpenApp('screen_vision');
      setToastNotification('Screen sharing active! Zara can now see your screen.');
      setTimeout(() => setToastNotification(null), 3500);
    }
  }, [screenState.isActive, handleOpenApp]);

  // App Control command execution
  const handleControlApp = useCallback(
    (appId: AppId, action: string, payload?: string) => {
      handleOpenApp(appId);
      if (appId === 'media_studio') {
        if (action === 'generate_photo' && payload) {
          handleGenerateMedia(payload, 'image', '1:1');
        } else if (action === 'generate_video' && payload) {
          handleGenerateMedia(payload, 'video', '16:9');
        }
      } else if (appId === 'soundboard') {
        if (action === 'play_audio' && payload) {
          handleChangeAtmosphere(payload as AtmosphereSound);
        } else if (action === 'stop_audio') {
          handleChangeAtmosphere('off');
        }
      } else if (appId === 'screen_vision') {
        if (action === 'start_screen_share' && !screenState.isActive) {
          handleToggleScreenShare();
        } else if (action === 'stop_screen_share' && screenState.isActive) {
          handleToggleScreenShare();
        }
      }
    },
    [handleOpenApp, handleGenerateMedia, handleChangeAtmosphere, screenState.isActive, handleToggleScreenShare]
  );

  // Sync actions ref for ToolManager callbacks
  useEffect(() => {
    appActionsRef.current = {
      openApp: handleOpenApp,
      closeApp: handleCloseApp,
      controlApp: handleControlApp,
      generatePhoto: (prompt, aspectRatio) => handleGenerateMedia(prompt, 'image', aspectRatio),
      generateVideo: (prompt, aspectRatio) => handleGenerateMedia(prompt, 'video', aspectRatio),
      seeUserScreen: async (_instruction) => {
        if (!screenState.isActive) {
          await handleToggleScreenShare();
        }
      },
    };
  }, [handleOpenApp, handleCloseApp, handleControlApp, handleGenerateMedia, screenState.isActive, handleToggleScreenShare]);

  // Prompt hint select
  const handleSelectPrompt = useCallback((prompt: string) => {
    if (state === 'disconnected') {
      pendingPromptRef.current = prompt;
      handleToggleConnect();
    } else {
      if (liveSessionRef.current) {
        liveSessionRef.current.sendPrompt(prompt);
      }
    }
  }, [state, handleToggleConnect]);

  const handleAskZaraAboutScreen = useCallback(
    (question: string) => {
      if (!screenState.isActive) {
        handleToggleScreenShare();
      }
      const fullPrompt = `Zara, looking at my screen: ${question}`;
      if (state === 'disconnected') {
        handleSelectPrompt(fullPrompt);
      } else if (liveSessionRef.current) {
        liveSessionRef.current.sendPrompt(fullPrompt);
      }
    },
    [screenState.isActive, handleToggleScreenShare, state, handleSelectPrompt]
  );

  const handleCaptureSnapshot = useCallback(() => {
    if (screenShareServiceRef.current) {
      const dataUrl = screenShareServiceRef.current.captureFrame();
      if (dataUrl) {
        setToastNotification('Screen snapshot captured & sent to Zara!');
        setTimeout(() => setToastNotification(null), 2500);
      }
    }
  }, []);

  // Clear session journal
  const handleClearLogs = useCallback(() => {
    SessionLogger.clearLogs();
    setSessionLogs([]);
  }, []);

  // Background aura gradients based on glowTheme and active UI
  const themeGradients = {
    violet_neon: 'from-purple-950/30 via-slate-950 to-slate-950',
    cyan_pulse: 'from-cyan-950/30 via-slate-950 to-slate-950',
    amber_gold: 'from-amber-950/30 via-slate-950 to-slate-950',
    emerald_zen: 'from-emerald-950/30 via-slate-950 to-slate-950',
    crimson_flame: 'from-rose-950/30 via-slate-950 to-slate-950',
  }[glowTheme];

  return (
    <div
      className={`min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden select-none bg-gradient-to-b ${themeGradients} transition-colors duration-1000`}
    >
      {/* Starfield / Grid Atmosphere Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] z-0" />

      {/* Top Navigation Bar with UI Mode Button */}
      <header className="relative z-30 w-full px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md bg-slate-950/60 border-b border-white/5">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {state !== 'disconnected' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight text-white">Zara</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Voice AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Charming • Witty • Audio-to-Audio
            </p>
          </div>
        </div>

        {/* Center UI Change, Universal Mute, Screen Vision, and Apps Controls */}
        <div className="order-3 sm:order-2 w-full sm:w-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-1 sm:mt-0">
          <UIModeButton
            currentMode={uiMode}
            onOpenModal={() => setIsUIGalleryOpen(true)}
            onCycleNext={handleCycleNextUI}
          />
          <MuteButton
            isMuted={isMuted}
            state={state}
            isVirtualMode={isVirtualMode}
            onToggleMute={handleToggleMute}
          />
          {/* See User Screen Toggle Button */}
          <button
            onClick={handleToggleScreenShare}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border transition-all duration-200 cursor-pointer select-none shadow-lg ${
              screenState.isActive
                ? 'bg-rose-950/85 border-rose-500/80 text-rose-200 hover:text-white hover:border-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.35)]'
                : 'bg-slate-900/80 border-slate-700/70 hover:border-cyan-400/70 text-slate-200 hover:text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
            }`}
            title={
              screenState.isActive
                ? 'Zara is watching your screen. Click to stop sharing.'
                : 'Share your screen so Zara can see and analyze it in real time.'
            }
          >
            {screenState.isActive ? (
              <Eye className="w-3.5 h-3.5 text-rose-400 animate-pulse drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300" />
            )}
            <span className="font-mono text-[11px] font-bold">
              {screenState.isActive ? 'SCREEN ON' : 'SEE SCREEN'}
            </span>
            {screenState.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>
          {/* Virtual Apps Studio Toggle Button */}
          <button
            onClick={() => handleOpenApp('media_studio')}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border border-slate-700/70 bg-slate-900/80 hover:border-purple-400/80 text-slate-200 hover:text-white shadow-lg transition-all duration-200 cursor-pointer select-none"
            title="Open AI Media Studio (Photo & Video generator)"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300" />
            <span className="font-mono text-[11px] font-bold">APPS</span>
          </button>
        </div>

        {/* Right Action Icons & Badges */}
        <div className="order-2 sm:order-3 flex items-center gap-2">
          {/* Live State Badge */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-md border transition-all ${
              state === 'disconnected'
                ? 'bg-slate-900/80 border-slate-700/60 text-slate-400'
                : state === 'connecting'
                ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300 shadow-cyan-950'
                : state === 'speaking'
                ? 'bg-fuchsia-950/80 border-fuchsia-500/70 text-fuchsia-300 shadow-fuchsia-950 shadow-md animate-pulse'
                : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-emerald-950 shadow-md'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'disconnected'
                  ? 'bg-slate-500'
                  : state === 'connecting'
                  ? 'bg-cyan-400 animate-ping'
                  : state === 'speaking'
                  ? 'bg-fuchsia-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="capitalize">{state}</span>
          </div>

          {/* Latency Tag if Connected */}
          {state !== 'disconnected' && metrics.latencyMs > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-1.5 rounded-full">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>{metrics.latencyMs}ms</span>
            </div>
          )}

          {/* Quick Actions Sidebar Trigger Button */}
          <button
            onClick={() => setIsQuickActionsOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/40 hover:border-cyan-300 text-cyan-200 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-cyan-950 cursor-pointer"
            aria-label="Open Quick Actions Sidebar"
            title="Open Quick Actions, Schedule & Companion Memory"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden md:inline">Quick Actions</span>
          </button>

          {/* Session Journal Toggle Button */}
          <button
            onClick={() => setIsJournalOpen(true)}
            className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label="View Session Journal"
            title="Session Journal & Interaction History"
          >
            <History className="w-4 h-4" />
            {sessionLogs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-slate-950" />
            )}
          </button>

          {/* Studio Settings Toggle */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label="Zara Studio Settings"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating System Toast for Quick Actions / Tool Memory Updates */}
      {toastNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-slate-900/95 border border-cyan-400/60 text-cyan-200 text-xs font-semibold flex items-center gap-2 shadow-2xl shadow-cyan-950/80 backdrop-blur-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{toastNotification}</span>
          </div>
        </div>
      )}

      {/* Main Content Area: Renders either one of 5 New Motion UIs or Classic Old UI */}
      {uiMode !== 'classic' ? (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-between w-full">
          {/* Error Notification Banner if any */}
          {errorMessage && (
            <div className="w-full max-w-xl mx-auto px-4 mt-3">
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 backdrop-blur-md flex items-center justify-between text-xs text-rose-200 animate-fade-in shadow-xl">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-100 font-bold px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <ModernNewUI
            uiMode={uiMode}
            state={state}
            micLevel={micLevel}
            outputLevel={outputLevel}
            isMuted={isMuted}
            isVirtualMode={isVirtualMode}
            selectedVoice={selectedVoice}
            glowTheme={glowTheme}
            currentAtmosphere={currentAtmosphere}
            websites={websites}
            timers={timers}
            metrics={metrics}
            onToggleConnect={handleToggleConnect}
            onToggleMute={handleToggleMute}
            onSelectPrompt={handleSelectPrompt}
            onDismissWebsite={handleDismissWebsite}
            onUpdateTimer={setTimers}
            onDismissTimer={handleDismissTimer}
            onChangeAtmosphere={handleChangeAtmosphere}
          />
        </main>
      ) : (
        /* Classic Old UI Layout */
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-xl mx-auto w-full">
          {/* Error Notification Banner if any */}
          {errorMessage && (
            <div className="w-full mb-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 backdrop-blur-md flex items-center justify-between text-xs text-rose-200 animate-fade-in shadow-xl">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-100 font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Zara Title Personality Hook */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5 drop-shadow-md">
              {state === 'disconnected' && 'Speak with Zara'}
              {state === 'connecting' && 'Tuning Voice Sync...'}
              {state === 'listening' && "I'm listening..."}
              {state === 'speaking' && 'Zara speaking...'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {state === 'disconnected'
                ? 'Tap the core below to begin low-latency voice conversation. Real-time audio only.'
                : state === 'listening'
                ? 'Speak naturally at any time. Zara can open links, set timers, and play ambient music.'
                : state === 'speaking'
                ? 'You can interrupt naturally whenever you want to cut in.'
                : 'Establishing ultra-low latency voice socket with Gemini Live...'}
            </p>
          </div>

          {/* Virtual Voice Mode Notice */}
          {isVirtualMode && state !== 'disconnected' && (
            <div className="w-full mb-3 px-3.5 py-2.5 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 backdrop-blur-md flex items-center justify-between text-xs text-indigo-200 animate-fade-in shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Virtual Voice Mode Active:</strong> No physical mic detected. Click any voice prompt below to speak to Zara!
                </span>
              </div>
            </div>
          )}

          {/* Central Animated Orb */}
          <div className="my-2">
            <ZaraOrb
              state={state}
              micLevel={micLevel}
              outputLevel={outputLevel}
              isMuted={isMuted}
              isVirtualMode={isVirtualMode}
              glowTheme={glowTheme}
              onToggleConnect={handleToggleConnect}
              onToggleMute={handleToggleMute}
            />
          </div>

          {/* Real-time Dynamic Soundwave Visualizer */}
          <div className="w-full my-2">
            <WaveformCanvas
              state={state}
              micLevel={micLevel}
              outputLevel={outputLevel}
              glowTheme={glowTheme}
            />
          </div>

          {/* Tool Activity Panel (Cards for Timers, Opened Sites, Ambient Tracks) */}
          <div className="w-full">
            <ToolActivityPanel
              websites={websites}
              timers={timers}
              currentAtmosphere={currentAtmosphere}
              onDismissWebsite={handleDismissWebsite}
              onUpdateTimer={setTimers}
              onDismissTimer={handleDismissTimer}
              onChangeAtmosphere={handleChangeAtmosphere}
            />
          </div>
        </main>
      )}

      {/* Bottom Footer (For Classic Old UI) */}
      {uiMode === 'classic' && (
        <footer className="relative z-30 w-full backdrop-blur-md bg-slate-950/60 border-t border-white/5 pb-6 pt-3">
          <ConversationStarters
            state={state}
            onSelectPrompt={handleSelectPrompt}
          />

          <div className="max-w-xl mx-auto px-4 mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Voice: {selectedVoice}</span>
              <span>•</span>
              <span>24kHz Stereo</span>
            </div>

            <div className="flex items-center gap-3">
              {state !== 'disconnected' && (
                <button
                  onClick={handleToggleConnect}
                  className="text-rose-400 hover:text-rose-300 font-sans text-xs font-semibold cursor-pointer"
                >
                  Disconnect
                </button>
              )}
              <span>Gemini Live Native</span>
            </div>
          </div>
        </footer>
      )}

      {/* Bottom Status Ribbon (For New Motion UIs) */}
      {uiMode !== 'classic' && (
        <footer className="relative z-30 w-full backdrop-blur-md bg-slate-950/70 border-t border-white/5 py-2.5 px-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-slate-400 uppercase font-bold">
                {UI_MODES_LIST.find((m) => m.id === uiMode)?.name || 'NEW UI'} (MOTION ACTIVE)
              </span>
            </div>
            <div className="flex items-center gap-3">
              {state !== 'disconnected' && (
                <button
                  onClick={handleToggleConnect}
                  className="text-rose-400 hover:text-rose-300 text-xs font-semibold font-sans cursor-pointer"
                >
                  DISCONNECT
                </button>
              )}
              <span className="text-slate-400">{selectedVoice} • 24kHz</span>
            </div>
          </div>
        </footer>
      )}

      {/* Studio Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={handleSelectVoice}
        selectedTheme={glowTheme}
        onSelectTheme={setGlowTheme}
        currentAtmosphere={currentAtmosphere}
        onSelectAtmosphere={handleChangeAtmosphere}
        metrics={metrics}
      />

      {/* Visual Session Journal Modal */}
      <SessionLogModal
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        logs={sessionLogs}
        onClearLogs={handleClearLogs}
      />

      {/* 6 UI Selection Gallery Modal */}
      <UISelectionModal
        isOpen={isUIGalleryOpen}
        onClose={() => setIsUIGalleryOpen(false)}
        activeMode={uiMode}
        onSelectMode={handleSetUiMode}
      />

      {/* Persistent Floating Quick Actions Pill on Right Edge across ALL UI modes */}
      <aside aria-label="Quick Actions Dock" className="fixed right-4 bottom-16 sm:bottom-20 z-40">
        <button
          onClick={() => setIsQuickActionsOpen(true)}
          className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-300 shadow-xl shadow-cyan-950/80 backdrop-blur-xl flex items-center gap-2 group transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Open Quick Actions Sidebar"
          title="Open Quick Actions & Companion Memory"
        >
          <Zap className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold hidden sm:inline">Quick Actions</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </button>
      </aside>

      {/* Persistent Quick Actions Sidebar */}
      <QuickActionsSidebar
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        state={state}
        selectedVoice={selectedVoice}
        onTriggerQuickAction={handleTriggerQuickAction}
        onSelectVoice={handleSelectVoice}
      />

      {/* Virtual App Windows Manager & Global Launcher Dock */}
      <WindowManager
        openApps={openApps}
        activeAppId={activeAppId}
        onOpenApp={handleOpenApp}
        onCloseApp={handleCloseApp}
        onMinimizeApp={handleMinimizeApp}
        onMaximizeApp={handleMaximizeApp}
        onFocusApp={handleFocusApp}
        onCloseAllApps={handleCloseAllApps}
        onGenerateMedia={async (prompt, type, ratio) => {
          await handleGenerateMedia(prompt, type, ratio);
        }}
        isGeneratingMedia={isGeneratingMedia}
        mediaHistory={mediaHistory}
        onOpenMediaResult={handleOpenMediaResult}
        screenState={screenState}
        onToggleScreenShare={handleToggleScreenShare}
        onAskZaraAboutScreen={handleAskZaraAboutScreen}
        onCaptureSnapshot={handleCaptureSnapshot}
        currentAtmosphere={currentAtmosphere}
        onChangeAtmosphere={handleChangeAtmosphere}
        onAddNote={(_note) => {
          setToastNotification('Saved note into Zara memory bank');
          setTimeout(() => setToastNotification(null), 2500);
        }}
        onScheduleUpdated={() => {
          setToastNotification('Daily schedule updated');
          setTimeout(() => setToastNotification(null), 2500);
        }}
        recentWebsites={websites}
        onOpenUrl={(url, title) => {
          setWebsites((prev) => [
            { id: `w_${Date.now()}`, url, title, timestamp: Date.now() },
            ...prev.slice(0, 4),
          ]);
        }}
        metrics={metrics}
        zaraState={state}
        micLevel={micLevel}
        outputLevel={outputLevel}
      />

      {/* Separate Media Result Window (Opens automatically when Photo or Video is generated) */}
      <MediaResultModal
        isOpen={isMediaResultOpen}
        mediaItem={selectedMediaResult}
        onClose={() => setIsMediaResultOpen(false)}
        onRegenerate={(prompt, type) =>
          handleGenerateMedia(prompt, type, selectedMediaResult?.aspectRatio || '1:1')
        }
      />
    </div>
  );
}
