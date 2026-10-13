import React, { useEffect, useRef } from 'react';
import { ZaraState, GlowTheme } from '../types/zara';

interface WaveformCanvasProps {
  state: ZaraState;
  micLevel: number;
  outputLevel: number;
  glowTheme: GlowTheme;
}

const THEME_COLORS: Record<GlowTheme, { primary: string; secondary: string; glow: string }> = {
  violet_neon: { primary: '#a855f7', secondary: '#ec4899', glow: 'rgba(168, 85, 247, 0.4)' },
  cyan_pulse: { primary: '#06b6d4', secondary: '#3b82f6', glow: 'rgba(6, 182, 212, 0.4)' },
  amber_gold: { primary: '#f59e0b', secondary: '#ef4444', glow: 'rgba(245, 158, 11, 0.4)' },
  emerald_zen: { primary: '#10b981', secondary: '#06b6d4', glow: 'rgba(16, 185, 129, 0.4)' },
  crimson_flame: { primary: '#f43f5e', secondary: '#fb923c', glow: 'rgba(244, 63, 94, 0.4)' },
};

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  state,
  micLevel,
  outputLevel,
  glowTheme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const colors = THEME_COLORS[glowTheme] || THEME_COLORS.violet_neon;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Determine active target energy based on state
      let energy = 0.08; // idle breathing amplitude
      if (state === 'listening') {
        energy = 0.12 + Math.min(1.0, micLevel * 1.5) * 0.75;
      } else if (state === 'speaking') {
        energy = 0.2 + Math.min(1.0, outputLevel * 1.8) * 0.8;
      } else if (state === 'connecting') {
        energy = 0.25;
      }

      phase += state === 'speaking' ? 0.07 : state === 'listening' ? 0.05 : 0.025;

      const centerY = height / 2;
      const waves = [
        { amp: 26 * energy, freq: 0.012, speed: 1.0, opacity: 0.8, color: colors.primary, lineWidth: 3 },
        { amp: 38 * energy, freq: 0.018, speed: -1.3, opacity: 0.6, color: colors.secondary, lineWidth: 2.2 },
        { amp: 18 * energy, freq: 0.024, speed: 1.6, opacity: 0.4, color: '#38bdf8', lineWidth: 1.8 },
        { amp: 46 * energy, freq: 0.009, speed: 0.8, opacity: 0.35, color: colors.glow, lineWidth: 4 },
      ];

      waves.forEach((wave) => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = wave.opacity;
        ctx.lineWidth = wave.lineWidth;
        ctx.lineCap = 'round';
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = state === 'speaking' || state === 'listening' ? 14 : 6;

        for (let x = 0; x < width; x += 3) {
          // Attenuation towards canvas edges (envelope)
          const normX = (x / width) * 2 - 1; // -1 to 1
          const envelope = Math.max(0, 1 - Math.pow(normX, 2));

          const y =
            centerY +
            Math.sin(x * wave.freq + phase * wave.speed) * wave.amp * envelope +
            Math.cos(x * wave.freq * 0.6 - phase * 0.5) * (wave.amp * 0.4) * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, micLevel, outputLevel, glowTheme]);

  return (
    <div className="w-full h-24 relative flex items-center justify-center overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        width={720}
        height={100}
        className="w-full h-full max-w-2xl opacity-90"
      />
    </div>
  );
};
