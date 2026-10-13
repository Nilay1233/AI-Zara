import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Power, Sparkles, Volume2, Radio } from 'lucide-react';
import { ZaraState, GlowTheme } from '../types/zara';

interface ZaraOrbProps {
  state: ZaraState;
  micLevel: number;
  outputLevel: number;
  isMuted: boolean;
  isVirtualMode?: boolean;
  glowTheme: GlowTheme;
  onToggleConnect: () => void;
  onToggleMute: () => void;
}

export const ZaraOrb: React.FC<ZaraOrbProps> = ({
  state,
  micLevel,
  outputLevel,
  isMuted,
  isVirtualMode = false,
  glowTheme,
  onToggleConnect,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Theme palettes
  const themeColors = {
    violet_neon: {
      core: '#c084fc',
      ring1: '#9333ea',
      ring2: '#ec4899',
      glow: 'rgba(168, 85, 247, 0.45)',
    },
    cyan_pulse: {
      core: '#38bdf8',
      ring1: '#06b6d4',
      ring2: '#3b82f6',
      glow: 'rgba(6, 182, 212, 0.45)',
    },
    amber_gold: {
      core: '#fde047',
      ring1: '#f59e0b',
      ring2: '#ef4444',
      glow: 'rgba(245, 158, 11, 0.45)',
    },
    emerald_zen: {
      core: '#6ee7b7',
      ring1: '#10b981',
      ring2: '#06b6d4',
      glow: 'rgba(16, 185, 129, 0.45)',
    },
    crimson_flame: {
      core: '#fda4af',
      ring1: '#f43f5e',
      ring2: '#fb923c',
      glow: 'rgba(244, 63, 94, 0.45)',
    },
  }[glowTheme];

  // Render ambient particle/orbital ring effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Particle nodes orbiting
    const particles = Array.from({ length: 48 }, (_, i) => ({
      angle: (i / 48) * Math.PI * 2,
      distance: 85 + (i % 4) * 20,
      speed: 0.01 + ((i % 5) * 0.004),
      size: 1.5 + (i % 3) * 1.2,
      alpha: 0.3 + (i % 4) * 0.2,
    }));

    const render = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Current dynamic energy
      let energy = 0.1;
      if (state === 'listening') {
        energy = 0.15 + Math.min(1.0, micLevel * 2.2);
      } else if (state === 'speaking') {
        energy = 0.3 + Math.min(1.0, outputLevel * 2.4);
      } else if (state === 'connecting') {
        energy = 0.35;
      }

      // Outer ripple rings
      const ringCount = state === 'speaking' || state === 'listening' ? 3 : 2;
      for (let r = 1; r <= ringCount; r++) {
        const radius = 95 + r * 28 + Math.sin(time * 2 + r) * (6 * energy);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = r % 2 === 0 ? themeColors.ring1 : themeColors.ring2;
        ctx.globalAlpha = Math.min(0.5, 0.08 + (energy * 0.3) / r);
        ctx.lineWidth = 1.2 + energy * 2;
        ctx.setLineDash([8 + r * 4, 12]);
        ctx.stroke();
        ctx.restore();
      }

      // Orbital glowing particles
      particles.forEach((p, idx) => {
        p.angle += p.speed * (state === 'speaking' ? 2.5 : state === 'listening' ? 1.8 : 1.0);
        const dist = p.distance + Math.sin(time + idx) * (14 * energy);
        const px = cx + Math.cos(p.angle) * dist;
        const py = cy + Math.sin(p.angle) * dist;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + energy * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = idx % 2 === 0 ? themeColors.core : themeColors.ring2;
        ctx.globalAlpha = Math.min(0.9, p.alpha * (0.8 + energy * 1.5));
        ctx.shadowColor = themeColors.core;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, micLevel, outputLevel, themeColors]);

  // Dynamic scale calculation for central button
  const dynamicScale =
    state === 'speaking'
      ? 1.0 + Math.min(0.2, outputLevel * 0.28)
      : state === 'listening'
      ? 1.0 + Math.min(0.18, micLevel * 0.22)
      : 1.0;

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Background canvas for orbiting aura & energy waves */}
      <canvas
        ref={canvasRef}
        width={380}
        height={380}
        className="absolute pointer-events-none w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] z-0"
      />

      {/* Ambient Pulsing Aura Glow Behind Orb */}
      <div
        className={`absolute rounded-full filter blur-2xl transition-all duration-700 pointer-events-none z-0 ${
          state === 'speaking'
            ? 'w-64 h-64 opacity-75'
            : state === 'listening'
            ? 'w-56 h-56 opacity-60'
            : state === 'connecting'
            ? 'w-52 h-52 opacity-50 animate-pulse'
            : 'w-44 h-44 opacity-25'
        }`}
        style={{
          backgroundColor: themeColors.ring1,
          boxShadow: `0 0 90px ${themeColors.glow}`,
        }}
      />

      {/* Main Central Interactive Orb Button */}
      <div className="relative z-10 flex flex-col items-center">
        <button
          onClick={onToggleConnect}
          style={{ transform: `scale(${dynamicScale})` }}
          aria-label={
            state === 'disconnected'
              ? 'Connect to Zara'
              : 'Disconnect voice session'
          }
          className={`group relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-95 cursor-pointer shadow-2xl backdrop-blur-xl border ${
            state === 'disconnected'
              ? 'bg-slate-900/80 border-slate-700/60 hover:border-slate-500 shadow-purple-950/40'
              : state === 'connecting'
              ? 'bg-slate-950/90 border-cyan-500/60 shadow-cyan-900/50'
              : state === 'speaking'
              ? 'bg-slate-950/95 border-fuchsia-500/80 shadow-fuchsia-900/60'
              : 'bg-slate-950/95 border-emerald-500/70 shadow-emerald-900/50'
          }`}
        >
          {/* Inner Glowing Gradient Sphere */}
          <div
            className={`absolute inset-2 rounded-full transition-all duration-500 flex items-center justify-center overflow-hidden ${
              state === 'disconnected'
                ? 'bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 opacity-90'
                : state === 'connecting'
                ? 'bg-gradient-to-tr from-cyan-950 via-slate-900 to-indigo-900'
                : state === 'speaking'
                ? 'bg-gradient-to-tr from-purple-950/90 via-fuchsia-950/60 to-slate-950'
                : 'bg-gradient-to-tr from-emerald-950/90 via-slate-950 to-teal-950/60'
            }`}
          >
            {/* Holographic Inner Ring Pulse */}
            <div
              className={`absolute inset-3 rounded-full border border-white/10 transition-opacity duration-300 ${
                state !== 'disconnected' ? 'opacity-80' : 'opacity-20'
              }`}
            />

            {/* Central Iconography */}
            <div className="relative z-20 flex flex-col items-center justify-center">
              {state === 'disconnected' && (
                <div className="flex flex-col items-center gap-1.5 text-slate-300 group-hover:text-white transition-colors">
                  <Power className="w-9 h-9 sm:w-11 sm:h-11 transition-transform group-hover:scale-110 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
                  <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400 group-hover:text-slate-200">
                    Connect
                  </span>
                </div>
              )}

              {state === 'connecting' && (
                <div className="flex flex-col items-center gap-1.5 text-cyan-400">
                  <Radio className="w-10 h-10 sm:w-12 sm:h-12 animate-spin duration-1000 drop-shadow-[0_0_16px_rgba(6,182,212,0.8)]" />
                  <span className="text-[11px] font-medium tracking-wider uppercase text-cyan-300">
                    Linking...
                  </span>
                </div>
              )}

              {state === 'listening' && (
                <div className="flex flex-col items-center gap-1.5 text-emerald-300">
                  <div className="relative">
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_16px_rgba(16,185,129,0.8)]" />
                    {micLevel > 0.15 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium tracking-wider uppercase text-emerald-300">
                    Listening
                  </span>
                </div>
              )}

              {state === 'speaking' && (
                <div className="flex flex-col items-center gap-1.5 text-fuchsia-300">
                  <div className="relative">
                    <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.9)]" />
                    <Sparkles className="w-4 h-4 text-pink-300 absolute -top-1.5 -right-2 animate-bounce" />
                  </div>
                  <span className="text-[11px] font-medium tracking-wider uppercase text-fuchsia-300">
                    Speaking
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Small Quick Mute / Virtual Mode Pill Below Orb when Active */}
        {state !== 'disconnected' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isVirtualMode) {
                onToggleMute();
              }
            }}
            className={`mt-4 px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-md border transition-all cursor-pointer ${
              isVirtualMode
                ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300 shadow-indigo-900/40'
                : isMuted
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 shadow-rose-900/40'
                : 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500'
            }`}
          >
            {isVirtualMode ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Virtual Voice Mode</span>
              </>
            ) : isMuted ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Mic Muted</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mic Active</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
