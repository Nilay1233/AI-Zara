import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { ZaraState } from '../types/zara';

interface MuteButtonProps {
  isMuted: boolean;
  state: ZaraState;
  isVirtualMode?: boolean;
  onToggleMute: () => void;
  className?: string;
}

interface Ripple {
  id: number;
  color: string;
}

/**
 * Play a synthesized micro-chime for tactile auditory feedback on toggle
 */
function playMuteChime(muted: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (muted) {
      // Gentle descending blip for muting: 480Hz -> 240Hz
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else {
      // Gentle ascending chime for unmuting: 320Hz -> 640Hz
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 250);
  } catch {
    // AudioContext blocked or not supported - silent graceful fallback
  }
}

export const MuteButton: React.FC<MuteButtonProps> = ({
  isMuted,
  state,
  isVirtualMode = false,
  onToggleMute,
  className = '',
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = useCallback(() => {
    // 1. Play tactile chime
    playMuteChime(!isMuted);

    // 2. Spawn expanding glowing ripple ring
    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      color: !isMuted ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.85)',
    };
    setRipples((prev) => [...prev.slice(-3), newRipple]);

    // 3. Increment click counter for spring bounce animation trigger
    setClickCount((prev) => prev + 1);

    // 4. Toggle the actual mute state
    onToggleMute();
  }, [isMuted, onToggleMute]);

  // Clean up old ripples
  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Keyboard shortcut: Press 'M' to toggle mute (when not focused in input/textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick]);

  const isConnected = state !== 'disconnected';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Expanding Glowing Ripple Rings on Click */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0.6, opacity: 0.95 }}
            animate={{ scale: 2.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => removeRipple(ripple.id)}
            className="absolute inset-0 rounded-full pointer-events-none z-0"
            style={{
              boxShadow: `0 0 20px 4px ${ripple.color}`,
              border: `2px solid ${ripple.color}`,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Main Spring Pulse Bounce Button */}
      <motion.button
        key={`mute-btn-${clickCount}`}
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.86 }}
        animate={
          clickCount > 0
            ? {
                scale: [1, 0.88, 1.12, 0.96, 1],
                rotate: isMuted ? [0, -6, 4, 0] : [0, 6, -4, 0],
              }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          duration: 0.42,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        aria-pressed={isMuted}
        title={
          isMuted
            ? 'Unmute Microphone (Zara AI voice remains audible) - [Key: M]'
            : 'Mute Microphone (Zara AI voice remains audible) - [Key: M]'
        }
        className={`group relative z-10 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border transition-all duration-200 cursor-pointer select-none shadow-lg ${
          isMuted
            ? 'bg-rose-950/85 border-rose-500/80 text-rose-200 hover:text-white hover:border-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.35)]'
            : isConnected
            ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-200 hover:text-white hover:border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
            : 'bg-slate-900/80 border-slate-700/70 hover:border-cyan-400/70 text-slate-200 hover:text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
        }`}
      >
        {/* Glow halo behind button */}
        <div
          className={`absolute -inset-0.5 rounded-full filter blur-sm -z-10 transition-opacity duration-300 opacity-60 group-hover:opacity-100 ${
            isMuted
              ? 'bg-rose-600/30'
              : isConnected
              ? 'bg-emerald-500/30'
              : 'bg-cyan-500/20'
          }`}
        />

        {/* Dynamic Icon with Morph Animation */}
        <div className="relative flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isMuted ? (
              <motion.div
                key="muted-icon"
                initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: 30, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="relative text-rose-400"
              >
                <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              </motion.div>
            ) : (
              <motion.div
                key="unmuted-icon"
                initial={{ scale: 0.5, rotate: 30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: -30, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="relative text-emerald-400 group-hover:text-emerald-300"
              >
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                {isConnected && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text Label */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] sm:text-xs tracking-tight">
            {isMuted ? (
              <span className="text-rose-200 font-bold">MUTED</span>
            ) : isConnected ? (
              <span className="text-emerald-300 font-bold">MIC ON</span>
            ) : (
              <span className="text-slate-300 group-hover:text-cyan-200">MIC READY</span>
            )}
          </span>

          {/* AI Voice Audible Pill indicator */}
          {isMuted && (
            <span
              className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-rose-900/60 text-[9px] font-mono text-rose-300 border border-rose-500/30"
              title="Zara voice speaker remains active and audible"
            >
              <Volume2 className="w-2.5 h-2.5 text-rose-300" />
              <span>AI ON</span>
            </span>
          )}
        </div>

        {/* Hotkey Tag */}
        <span className="hidden md:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-slate-400 border border-white/5">
          M
        </span>
      </motion.button>

      {/* Hover Floating Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap"
          >
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-700 text-slate-200 text-[11px] shadow-2xl backdrop-blur-md flex items-center gap-2">
              {isMuted ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    Microphone is <strong className="text-rose-300">muted</strong>. Zara voice
                    stays <strong className="text-emerald-300">audible</strong>.
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Microphone is <strong className="text-emerald-300">active</strong>. Click or
                    press <strong className="text-cyan-300">M</strong> to mute.
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
