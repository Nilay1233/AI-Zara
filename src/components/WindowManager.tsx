import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Sparkles,
  Eye,
  BookOpen,
  Volume2,
  Calendar,
  Globe,
  Activity,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  AppId,
  AppWindowConfig,
  GeneratedMediaItem,
  MediaType,
  ScreenShareState,
  AtmosphereSound,
  WebsiteAction,
  SessionMetrics,
  ZaraState,
} from '../types/zara';
import { MediaStudioApp } from './apps/MediaStudioApp';
import { ScreenVisionApp } from './apps/ScreenVisionApp';
import { NotesApp } from './apps/NotesApp';
import { SoundboardApp } from './apps/SoundboardApp';
import { ScheduleApp } from './apps/ScheduleApp';
import { BrowserApp } from './apps/BrowserApp';
import { DiagnosticsApp } from './apps/DiagnosticsApp';

export interface WindowManagerProps {
  openApps: Record<AppId, AppWindowConfig>;
  activeAppId: AppId | null;
  onOpenApp: (appId: AppId, initialData?: any) => void;
  onCloseApp: (appId: AppId) => void;
  onMinimizeApp: (appId: AppId) => void;
  onMaximizeApp: (appId: AppId) => void;
  onFocusApp: (appId: AppId) => void;
  onCloseAllApps: () => void;

  // Media generation props
  onGenerateMedia: (prompt: string, type: MediaType, aspectRatio: string) => Promise<void>;
  isGeneratingMedia: boolean;
  mediaHistory: GeneratedMediaItem[];
  onOpenMediaResult: (item: GeneratedMediaItem) => void;

  // Screen share props
  screenState: ScreenShareState;
  onToggleScreenShare: () => void;
  onAskZaraAboutScreen: (question: string) => void;
  onCaptureSnapshot: () => void;

  // Other apps props
  currentAtmosphere: AtmosphereSound;
  onChangeAtmosphere: (sound: AtmosphereSound) => void;
  onAddNote: (note: string) => void;
  onScheduleUpdated: () => void;
  recentWebsites: WebsiteAction[];
  onOpenUrl: (url: string, title: string) => void;
  metrics: SessionMetrics;
  zaraState: ZaraState;
  micLevel: number;
  outputLevel: number;
}

export const APPS_METADATA: Record<
  AppId,
  { title: string; icon: any; color: string; badge?: string }
> = {
  media_studio: {
    title: 'Media Studio',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    badge: 'Photo & Video',
  },
  screen_vision: {
    title: 'Screen Vision',
    icon: Eye,
    color: 'from-rose-500 to-orange-500',
    badge: 'See Screen',
  },
  notes: {
    title: 'Notes & Memory',
    icon: BookOpen,
    color: 'from-cyan-500 to-blue-500',
  },
  soundboard: {
    title: 'Soundboard',
    icon: Volume2,
    color: 'from-violet-500 to-indigo-500',
  },
  schedule: {
    title: 'Daily Schedule',
    icon: Calendar,
    color: 'from-emerald-500 to-teal-500',
  },
  browser: {
    title: 'Web Explorer',
    icon: Globe,
    color: 'from-blue-500 to-cyan-500',
  },
  diagnostics: {
    title: 'Diagnostics',
    icon: Activity,
    color: 'from-amber-500 to-orange-500',
  },
};

export const WindowManager: React.FC<WindowManagerProps> = ({
  openApps,
  activeAppId,
  onOpenApp,
  onCloseApp,
  onMinimizeApp,
  onMaximizeApp,
  onFocusApp,
  onCloseAllApps,
  onGenerateMedia,
  isGeneratingMedia,
  mediaHistory,
  onOpenMediaResult,
  screenState,
  onToggleScreenShare,
  onAskZaraAboutScreen,
  onCaptureSnapshot,
  currentAtmosphere,
  onChangeAtmosphere,
  onAddNote,
  onScheduleUpdated,
  recentWebsites,
  onOpenUrl,
  metrics,
  zaraState,
  micLevel,
  outputLevel,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Filter visible open windows that aren't minimized
  const visibleWindows = (Object.values(openApps) as AppWindowConfig[]).filter(
    (win) => win.isOpen && !win.isMinimized
  );

  const openCount = (Object.values(openApps) as AppWindowConfig[]).filter(
    (win) => win.isOpen
  ).length;

  return (
    <>
      {/* Active Windows Layer */}
      <AnimatePresence>
        {visibleWindows.map((win) => {
          const meta = APPS_METADATA[win.id];
          const Icon = meta.icon;
          const isActive = activeAppId === win.id;

          return (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ zIndex: win.zIndex }}
              onClick={() => onFocusApp(win.id)}
              className={`fixed inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bottom-20 sm:bottom-24 z-40 flex flex-col rounded-2xl sm:rounded-3xl border backdrop-blur-2xl shadow-2xl overflow-hidden transition-all ${
                win.isMaximized
                  ? 'top-14 sm:top-16 inset-x-2 sm:inset-x-4 bottom-20 sm:bottom-24 w-auto max-w-none'
                  : 'top-20 sm:top-24 w-full sm:w-[680px] max-w-2xl max-h-[76vh]'
              } ${
                isActive
                  ? 'border-cyan-500/60 shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/40 bg-slate-950/95'
                  : 'border-slate-800 shadow-xl bg-slate-950/90'
              }`}
            >
              {/* Window Header Title Bar */}
              <div
                className={`flex items-center justify-between px-4 py-2.5 border-b select-none cursor-move ${
                  isActive
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-950/80 border-slate-850'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg bg-gradient-to-tr ${meta.color} text-white shadow-sm`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {win.title || meta.title}
                    </span>
                    {meta.badge && (
                      <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-white/10 text-slate-300">
                        {meta.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Window Control Buttons: Minimize, Maximize, Close */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMinimizeApp(win.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Minimize window"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMaximizeApp(win.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={win.isMaximized ? 'Restore window size' : 'Maximize window'}
                  >
                    {win.isMaximized ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseApp(win.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-950 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
                    title="Close window"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Window Content Body */}
              <div className="flex-1 overflow-hidden relative">
                {win.id === 'media_studio' && (
                  <MediaStudioApp
                    onGenerate={onGenerateMedia}
                    isGenerating={isGeneratingMedia}
                    history={mediaHistory}
                    onOpenResult={onOpenMediaResult}
                  />
                )}
                {win.id === 'screen_vision' && (
                  <ScreenVisionApp
                    screenState={screenState}
                    onToggleScreenShare={onToggleScreenShare}
                    onAskZaraAboutScreen={onAskZaraAboutScreen}
                    onCaptureSnapshot={onCaptureSnapshot}
                  />
                )}
                {win.id === 'notes' && <NotesApp onAddNote={onAddNote} />}
                {win.id === 'soundboard' && (
                  <SoundboardApp
                    currentAtmosphere={currentAtmosphere}
                    onChangeAtmosphere={onChangeAtmosphere}
                  />
                )}
                {win.id === 'schedule' && <ScheduleApp onScheduleUpdated={onScheduleUpdated} />}
                {win.id === 'browser' && (
                  <BrowserApp recentWebsites={recentWebsites} onOpenUrl={onOpenUrl} />
                )}
                {win.id === 'diagnostics' && (
                  <DiagnosticsApp
                    metrics={metrics}
                    state={zaraState}
                    micLevel={micLevel}
                    outputLevel={outputLevel}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Global Apps Dock / Launcher Bar (Fixed at bottom across all UI modes) */}
      <div className="fixed bottom-3 inset-x-0 z-30 flex justify-center pointer-events-none px-2">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-slate-950/85 backdrop-blur-2xl border border-slate-800/90 shadow-[0_10px_40px_rgba(0,0,0,0.6)] max-w-full overflow-x-auto"
        >
          {/* Dock Apps Icons */}
          {(Object.keys(APPS_METADATA) as AppId[]).map((appId) => {
            const meta = APPS_METADATA[appId];
            const Icon = meta.icon;
            const win = openApps[appId];
            const isOpen = win?.isOpen;
            const isFront = activeAppId === appId && isOpen && !win.isMinimized;
            const isScreenVision = appId === 'screen_vision' && screenState.isActive;

            return (
              <button
                key={appId}
                onClick={() => {
                  if (isOpen && !win.isMinimized && activeAppId === appId) {
                    onMinimizeApp(appId);
                  } else {
                    onOpenApp(appId);
                  }
                }}
                className={`group relative p-2 sm:p-2.5 rounded-xl sm:rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isFront
                    ? 'bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : isOpen
                    ? 'bg-slate-800/90 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title={`${meta.title} • ${isOpen ? (win.isMinimized ? 'Minimized (Click to restore)' : 'Open') : 'Click to launch'}`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110 ${
                    isScreenVision ? 'text-rose-400 animate-pulse' : ''
                  }`}
                />

                {/* Open Indicator Dot */}
                {isOpen && (
                  <span
                    className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full ${
                      isFront
                        ? 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]'
                        : win.isMinimized
                        ? 'bg-slate-500'
                        : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                    }`}
                  />
                )}

                {/* Screen Share Live Radar indicator */}
                {isScreenVision && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}

          {/* Close all open apps button if any open */}
          {openCount > 0 && (
            <div className="pl-1 sm:pl-2 ml-1 border-l border-slate-800 flex items-center">
              <button
                onClick={onCloseAllApps}
                className="p-1.5 rounded-lg sm:rounded-full text-slate-400 hover:text-rose-300 hover:bg-rose-950/60 text-[10px] font-mono transition-colors cursor-pointer"
                title="Close all open app windows"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};
