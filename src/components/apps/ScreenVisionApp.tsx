import React, { useRef, useEffect } from 'react';
import {
  Monitor,
  Video,
  VideoOff,
  Eye,
  Scan,
  Sparkles,
  Camera,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { ScreenShareState } from '../../types/zara';

interface ScreenVisionAppProps {
  screenState: ScreenShareState;
  onToggleScreenShare: () => void;
  onAskZaraAboutScreen: (question: string) => void;
  onCaptureSnapshot: () => void;
}

export const ScreenVisionApp: React.FC<ScreenVisionAppProps> = ({
  screenState,
  onToggleScreenShare,
  onAskZaraAboutScreen,
  onCaptureSnapshot,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync stream to video preview element
  useEffect(() => {
    // MediaStream is accessed via ScreenShareService in parent
  }, [screenState.isActive]);

  const quickQuestions = [
    'What is currently visible on my screen?',
    'Explain the code or errors you see on my screen',
    'Summarize this web page or document for me',
    'Review my design layout and give creative feedback',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl transition-all ${
              screenState.isActive
                ? 'bg-rose-600/30 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Zara Screen Vision HUD</span>
              {screenState.isActive && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              {screenState.isActive
                ? 'Active • Streaming frames to Gemini Live in real-time'
                : 'Screen sharing is currently paused'}
            </p>
          </div>
        </div>

        {/* Start / Stop Toggle Button */}
        <button
          onClick={onToggleScreenShare}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer ${
            screenState.isActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
          }`}
        >
          {screenState.isActive ? (
            <>
              <VideoOff className="w-3.5 h-3.5" />
              <span>Stop Sharing</span>
            </>
          ) : (
            <>
              <Video className="w-3.5 h-3.5" />
              <span>Share My Screen</span>
            </>
          )}
        </button>
      </div>

      {/* Main Screen Stream Display / Status Window */}
      <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/80 min-h-[220px] sm:min-h-[280px] flex items-center justify-center">
        {screenState.isActive ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {/* Visual Radar Scan Effect */}
            <div className="relative w-28 h-28 rounded-full border border-cyan-500/30 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
              <div className="w-20 h-20 rounded-full border border-rose-500/40 flex items-center justify-center">
                <Monitor className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 text-[10px] font-mono border border-rose-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                LIVE VISION FEED
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 text-[10px] font-mono">
                {screenState.resolution || 'Active Monitor'}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium max-w-sm mt-1">
              Zara is actively watching your screen frames. Speak naturally or click any prompt below!
            </p>

            <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span>FRAMES: {screenState.frameCount}</span>
              <span>•</span>
              <span>RATE: {screenState.fps} FPS</span>
              <span>•</span>
              <span>LATENCY: Real-time</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
              <Monitor className="w-8 h-8" />
            </div>
            <h5 className="text-sm font-semibold text-slate-200">Screen Vision Inactive</h5>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
              Allow Zara to see your screen so she can read documents, troubleshoot software errors, analyze code, and guide you in real time.
            </p>
            <button
              onClick={onToggleScreenShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span>Allow Zara to See My Screen</span>
            </button>
          </div>
        )}
      </div>

      {/* Manual Snapshot & Quick Voice Questions */}
      <div className="mt-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Zara About Your Screen</span>
          </span>
          {screenState.isActive && (
            <button
              onClick={onCaptureSnapshot}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Camera className="w-3 h-3" />
              <span>Send Snapshot</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskZaraAboutScreen(q)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-left text-xs text-slate-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <span className="line-clamp-1">{q}</span>
              <Scan className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-1 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
