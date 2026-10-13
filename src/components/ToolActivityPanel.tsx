import React, { useEffect } from 'react';
import { ExternalLink, X, Clock, Play, Pause, Volume2, CloudRain, Disc, Coffee, Compass, VolumeX } from 'lucide-react';
import { WebsiteAction, ActiveTimer, AtmosphereSound } from '../types/zara';

interface ToolActivityPanelProps {
  websites: WebsiteAction[];
  timers: ActiveTimer[];
  currentAtmosphere: AtmosphereSound;
  onDismissWebsite: (id: string) => void;
  onUpdateTimer: (timers: ActiveTimer[]) => void;
  onDismissTimer: (id: string) => void;
  onChangeAtmosphere: (sound: AtmosphereSound) => void;
}

export const ToolActivityPanel: React.FC<ToolActivityPanelProps> = ({
  websites,
  timers,
  currentAtmosphere,
  onDismissWebsite,
  onUpdateTimer,
  onDismissTimer,
  onChangeAtmosphere,
}) => {
  // Timer countdown ticker
  useEffect(() => {
    if (timers.length === 0) return;

    const interval = setInterval(() => {
      let changed = false;
      const updated = timers.map((t) => {
        if (t.isRunning && t.remainingSeconds > 0) {
          changed = true;
          const nextSec = t.remainingSeconds - 1;
          if (nextSec === 0) {
            // Play gentle chime
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.6);
            } catch {}
          }
          return { ...t, remainingSeconds: nextSec, isRunning: nextSec > 0 };
        }
        return t;
      });

      if (changed) {
        onUpdateTimer(updated);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, onUpdateTimer]);

  const toggleTimerPause = (id: string) => {
    onUpdateTimer(
      timers.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const atmosphereIcons: Record<AtmosphereSound, React.ReactNode> = {
    rain: <CloudRain className="w-4 h-4 text-cyan-400" />,
    cyberpunk_lofi: <Disc className="w-4 h-4 text-fuchsia-400" />,
    cafe: <Coffee className="w-4 h-4 text-amber-400" />,
    deep_space: <Compass className="w-4 h-4 text-indigo-400" />,
    off: <VolumeX className="w-4 h-4 text-slate-400" />,
  };

  const hasActivity = websites.length > 0 || timers.length > 0 || currentAtmosphere !== 'off';
  if (!hasActivity) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-3 px-4 z-20">
      {/* Active Timers */}
      {timers.map((timer) => (
        <div
          key={timer.id}
          className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-xl p-3.5 shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  timer.remainingSeconds === 0
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 animate-pulse'
                    : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300 truncate max-w-[150px]">
                  {timer.label}
                </p>
                <p className="text-lg font-mono font-bold text-white tracking-wider">
                  {timer.remainingSeconds === 0 ? 'Completed!' : formatSeconds(timer.remainingSeconds)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {timer.remainingSeconds > 0 && (
                <button
                  onClick={() => toggleTimerPause(timer.id)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title={timer.isRunning ? 'Pause' : 'Resume'}
                >
                  {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => onDismissTimer(timer.id)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timer.remainingSeconds === 0 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-fuchsia-500'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (timer.remainingSeconds / timer.totalSeconds) * 100))}%`,
              }}
            />
          </div>
        </div>
      ))}

      {/* Website Action Cards */}
      {websites.map((site) => (
        <div
          key={site.id}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/90 to-indigo-950/70 border border-slate-700/60 backdrop-blur-xl p-3.5 shadow-xl flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Zara Action
                </span>
                <p className="text-xs font-semibold text-slate-200 truncate">{site.title}</p>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {site.reason || site.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <span>Visit</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => onDismissWebsite(site.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Ambient Atmosphere Card if active */}
      {currentAtmosphere !== 'off' && (
        <div className="rounded-2xl bg-slate-900/70 border border-slate-700/50 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800">
              {atmosphereIcons[currentAtmosphere]}
            </div>
            <span>
              Atmosphere:{' '}
              <strong className="text-white capitalize">
                {currentAtmosphere.replace('_', ' ')}
              </strong>
            </span>
          </div>
          <button
            onClick={() => onChangeAtmosphere('off')}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Turn Off
          </button>
        </div>
      )}
    </div>
  );
};
