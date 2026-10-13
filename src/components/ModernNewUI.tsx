import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Power,
  Sparkles,
  Volume2,
  Radio,
  Clock,
  ExternalLink,
  Flame,
  Zap,
  Activity,
  Layers,
  Compass,
  Orbit,
  Waves,
  Minus,
} from 'lucide-react';
import {
  ZaraState,
  VoiceName,
  GlowTheme,
  AtmosphereSound,
  WebsiteAction,
  ActiveTimer,
  SessionMetrics,
  UIMode,
} from '../types/zara';
import { ToolActivityPanel } from './ToolActivityPanel';
import { ConversationStarters } from './ConversationStarters';
import { UI_MODES_LIST } from '../config/uiModes';

interface ModernNewUIProps {
  uiMode: UIMode;
  state: ZaraState;
  micLevel: number;
  outputLevel: number;
  isMuted: boolean;
  isVirtualMode: boolean;
  selectedVoice: VoiceName;
  glowTheme: GlowTheme;
  currentAtmosphere: AtmosphereSound;
  websites: WebsiteAction[];
  timers: ActiveTimer[];
  metrics: SessionMetrics;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onSelectPrompt: (prompt: string) => void;
  onDismissWebsite: (id: string) => void;
  onUpdateTimer: (timers: ActiveTimer[]) => void;
  onDismissTimer: (id: string) => void;
  onChangeAtmosphere: (sound: AtmosphereSound) => void;
}

export const ModernNewUI: React.FC<ModernNewUIProps> = ({
  uiMode,
  state,
  micLevel,
  outputLevel,
  isMuted,
  isVirtualMode,
  selectedVoice,
  glowTheme,
  currentAtmosphere,
  websites,
  timers,
  metrics,
  onToggleConnect,
  onToggleMute,
  onSelectPrompt,
  onDismissWebsite,
  onUpdateTimer,
  onDismissTimer,
  onChangeAtmosphere,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeInfo = UI_MODES_LIST.find((m) => m.id === uiMode) || UI_MODES_LIST[1];

  // Multi-theme reactive canvas visualizer (Tailored for each of the New UIs)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Cosmic starfield particles
    const cosmicStars = Array.from({ length: 42 }, () => ({
      x: Math.random() * 380,
      y: Math.random() * 380,
      size: Math.random() * 2 + 0.8,
      speed: Math.random() * 0.02 + 0.005,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    const render = () => {
      time += 0.025;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      let energy = 0.08;
      if (state === 'listening') {
        energy = 0.15 + Math.min(1.0, micLevel * 2.5);
      } else if (state === 'speaking') {
        energy = 0.25 + Math.min(1.0, outputLevel * 2.8);
      } else if (state === 'connecting') {
        energy = 0.35;
      }

      // 1. HOLOGRAM DECK: Circular Radar Equalizer & Gyro Rings
      if (uiMode === 'hologram') {
        const baseRadius = 118;
        const totalTicks = 64;

        for (let i = 0; i < totalTicks; i++) {
          const theta = (i / totalTicks) * Math.PI * 2 + time * 0.8;
          const freqMod = Math.sin(theta * 5 + time * 2) * Math.cos(theta * 3 - time);
          const tickLength = 5 + Math.abs(freqMod) * 24 * energy;

          const x1 = cx + Math.cos(theta) * baseRadius;
          const y1 = cy + Math.sin(theta) * baseRadius;
          const x2 = cx + Math.cos(theta) * (baseRadius + tickLength);
          const y2 = cy + Math.sin(theta) * (baseRadius + tickLength);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = i % 4 === 0 ? 2.5 : 1.2;
          ctx.strokeStyle = state === 'speaking' ? '#ec4899' : state === 'listening' ? '#06b6d4' : '#38bdf8';
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = state !== 'disconnected' ? 8 : 2;
          ctx.stroke();
          ctx.restore();
        }

        // Inner Gyro Ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 94 + Math.sin(time * 3) * (5 * energy), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([12, 14]);
        ctx.stroke();
        ctx.restore();
      }

      // 2. CYBERPUNK NOIR: Neon Vertical Spectrum Equalizer & Tech Glitch Rings
      else if (uiMode === 'cyberpunk') {
        const barCount = 32;
        const barWidth = 4;
        const startX = cx - (barCount * 8) / 2;

        // Equalizer waveform bottom bars
        for (let b = 0; b < barCount; b++) {
          const h = 6 + Math.abs(Math.sin(b * 0.4 + time * 3)) * 48 * energy;
          const bx = startX + b * 8;
          const by = cy + 105;

          ctx.save();
          ctx.fillStyle = b % 2 === 0 ? '#ec4899' : '#06b6d4';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 8;
          ctx.fillRect(bx, by - h, barWidth, h);
          ctx.restore();
        }

        // Angular Hexagonal Scanner Ring
        ctx.save();
        ctx.beginPath();
        const sides = 6;
        const hexRadius = 115 + Math.sin(time * 2) * (6 * energy);
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2 + time * 0.5;
          const hx = cx + Math.cos(a) * hexRadius;
          const hy = cy + Math.sin(a) * hexRadius;
          if (s === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }

      // 3. LIQUID AURORA: Morphing Fluid Waves & Soft Spectral Rings
      else if (uiMode === 'aurora') {
        const waveCount = 3;
        for (let w = 0; w < waveCount; w++) {
          ctx.save();
          ctx.beginPath();
          const rad = 100 + w * 16 + Math.sin(time * 1.5 + w) * (10 * energy);
          for (let a = 0; a <= Math.PI * 2; a += 0.1) {
            const distortion = Math.sin(a * 4 + time * 2 + w) * (8 * energy);
            const r = rad + distortion;
            const ax = cx + Math.cos(a) * r;
            const ay = cy + Math.sin(a) * r;
            if (a === 0) ctx.moveTo(ax, ay);
            else ctx.lineTo(ax, ay);
          }
          ctx.closePath();
          ctx.strokeStyle = w === 0 ? '#10b981' : w === 1 ? '#06b6d4' : '#a855f7';
          ctx.globalAlpha = 0.5 + energy * 0.4;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4. ZEN MINIMALIST: Hairline Concentric Breathing Rings
      else if (uiMode === 'minimal') {
        ctx.save();
        ctx.beginPath();
        const minRadius = 108 + Math.sin(time * 1.2) * (5 * energy);
        ctx.arc(cx, cy, minRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#e4e4e7';
        ctx.globalAlpha = 0.35 + energy * 0.5;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        // Subtle secondary outer ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, minRadius + 22, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(228, 228, 231, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // 5. COSMIC SPACE: Starfield & Elliptical Gravitational Orbit Rings
      else if (uiMode === 'cosmic') {
        // Drifting stars
        cosmicStars.forEach((star) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = '#c7d2fe';
          ctx.globalAlpha = star.alpha * (0.6 + energy * 0.8);
          ctx.shadowColor = '#818cf8';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.restore();
        });

        // 3D Elliptical Orbit Rings
        ctx.save();
        ctx.beginPath();
        const rx = 125 + Math.sin(time) * (6 * energy);
        const ry = 48 + Math.sin(time) * (3 * energy);
        ctx.ellipse(cx, cy, rx, ry, time * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [uiMode, state, micLevel, outputLevel]);

  const scale =
    state === 'speaking'
      ? 1.0 + Math.min(0.22, outputLevel * 0.3)
      : state === 'listening'
      ? 1.0 + Math.min(0.18, micLevel * 0.25)
      : 1.0;

  return (
    <motion.div
      key={uiMode}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full flex-1 flex flex-col items-center justify-between py-4 px-3 sm:px-6"
    >
      {/* Top HUD Telemetry Ribbon with Motion */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-full max-w-xl flex items-center justify-between py-2 px-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl mb-4 text-xs font-mono shadow-md"
      >
        <div className="flex items-center gap-2 text-slate-300">
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: modeInfo.accent }}
          />
          <span className="font-bold text-white uppercase">{modeInfo.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300 uppercase font-semibold">{state}</span>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>{selectedVoice}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            <span>{metrics.latencyMs > 0 ? `${metrics.latencyMs}ms` : 'Sync'}</span>
          </div>
        </div>
      </motion.div>

      {/* Center Stage: Interactive Holographic Core with Framer Motion */}
      <motion.div
        animate={{
          y: state === 'speaking' ? [0, -5, 0] : [0, -3, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: state === 'speaking' ? 2 : 4,
          ease: 'easeInOut',
        }}
        className="relative flex flex-col items-center justify-center my-auto py-4"
      >
        {/* Thematic Canvas Equalizer */}
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="absolute pointer-events-none w-[330px] h-[330px] sm:w-[380px] sm:h-[380px] z-0"
        />

        {/* Ambient Pulsing Aura Glow */}
        <motion.div
          animate={{
            scale: state === 'speaking' ? [1, 1.25, 1] : [1, 1.1, 1],
            opacity: state === 'speaking' ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="absolute rounded-full filter blur-3xl pointer-events-none z-0 w-64 h-64"
          style={{ backgroundColor: modeInfo.accent }}
        />

        {/* Central Core Interactive Button */}
        <motion.button
          onClick={onToggleConnect}
          style={{ transform: `scale(${scale})` }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={state === 'disconnected' ? 'Engage Zara Core' : 'Disconnect'}
          className={`group relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-2xl backdrop-blur-2xl border ${
            state === 'disconnected'
              ? 'bg-slate-950/90 border-slate-700 hover:border-cyan-400 shadow-slate-950/50'
              : state === 'connecting'
              ? 'bg-slate-950/95 border-cyan-400 shadow-cyan-900/60'
              : state === 'speaking'
              ? 'bg-slate-950/95 border-fuchsia-500 shadow-fuchsia-900/70'
              : 'bg-slate-950/95 border-emerald-400 shadow-emerald-900/60'
          }`}
        >
          {/* Inner Spherical Glass Core */}
          <div className="absolute inset-2.5 rounded-full border border-white/10 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-1.5">
              {state === 'disconnected' && (
                <>
                  <Power className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 group-hover:text-cyan-300">
                    CONNECT
                  </span>
                </>
              )}

              {state === 'connecting' && (
                <>
                  <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 animate-pulse drop-shadow-[0_0_16px_rgba(6,182,212,0.9)]" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-300">
                    LINKING
                  </span>
                </>
              )}

              {state === 'listening' && (
                <>
                  <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-300 drop-shadow-[0_0_18px_rgba(16,185,129,0.9)]" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-300">
                    LISTENING
                  </span>
                </>
              )}

              {state === 'speaking' && (
                <>
                  <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 text-fuchsia-300 drop-shadow-[0_0_20px_rgba(236,72,153,0.9)]" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-fuchsia-300">
                    SPEAKING
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.button>

        {/* Quick Audio Mute / Mode Control */}
        {state !== 'disconnected' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onToggleMute}
            className={`relative z-10 mt-5 px-4 py-1.5 rounded-full text-xs font-mono font-medium flex items-center gap-2 backdrop-blur-md border transition-all cursor-pointer ${
              isVirtualMode
                ? 'bg-indigo-950/80 border-indigo-500/70 text-indigo-300 shadow-lg shadow-indigo-950'
                : isMuted
                ? 'bg-rose-950/80 border-rose-500/70 text-rose-300 shadow-lg shadow-rose-950'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
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
                <span>Mute Active</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Microphone Live</span>
              </>
            )}
          </motion.button>
        )}
      </motion.div>

      {/* Active Tools Streamlined Dock */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-lg mb-3"
      >
        <ToolActivityPanel
          websites={websites}
          timers={timers}
          currentAtmosphere={currentAtmosphere}
          onDismissWebsite={onDismissWebsite}
          onUpdateTimer={onUpdateTimer}
          onDismissTimer={onDismissTimer}
          onChangeAtmosphere={onChangeAtmosphere}
        />
      </motion.div>

      {/* Suggested Voice Prompts Dock */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="w-full max-w-lg"
      >
        <ConversationStarters state={state} onSelectPrompt={onSelectPrompt} />
      </motion.div>
    </motion.div>
  );
};
