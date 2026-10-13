import React from 'react';
import { X, Sparkles, Volume2, Palette, Activity, Check, Radio } from 'lucide-react';
import { VoiceName, GlowTheme, AtmosphereSound, SessionMetrics, VoiceOption } from '../types/zara';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  selectedTheme: GlowTheme;
  onSelectTheme: (theme: GlowTheme) => void;
  currentAtmosphere: AtmosphereSound;
  onSelectAtmosphere: (sound: AtmosphereSound) => void;
  metrics: SessionMetrics;
}

const VOICES: VoiceOption[] = [
  {
    id: 'Aoede',
    name: 'Aoede (Default)',
    description: 'Youthful, expressive, charming, and naturally witty.',
    tags: ['Charming', 'Playful', 'Recommended'],
  },
  {
    id: 'Kore',
    name: 'Kore',
    description: 'Smooth, relaxed, warm, and soothing conversational tone.',
    tags: ['Calm', 'Warm'],
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    description: 'Crisp, articulate, dynamic, and modern pacing.',
    tags: ['Energetic', 'Modern'],
  },
  {
    id: 'Puck',
    name: 'Puck',
    description: 'Cheeky, playful, bold, and energetic banter.',
    tags: ['Spirited', 'Cheeky'],
  },
];

const THEMES: Array<{ id: GlowTheme; name: string; color: string; desc: string }> = [
  { id: 'violet_neon', name: 'Violet Neon', color: 'from-purple-500 to-pink-500', desc: 'Cyberpunk royalty' },
  { id: 'cyan_pulse', name: 'Cyan Pulse', color: 'from-cyan-400 to-blue-500', desc: 'Futuristic hologram' },
  { id: 'amber_gold', name: 'Amber Gold', color: 'from-amber-400 to-rose-500', desc: 'Warm radiant sunset' },
  { id: 'emerald_zen', name: 'Emerald Zen', color: 'from-emerald-400 to-teal-500', desc: 'Electric biome' },
  { id: 'crimson_flame', name: 'Crimson Flame', color: 'from-rose-500 to-orange-500', desc: 'Passionate spark' },
];

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  selectedTheme,
  onSelectTheme,
  currentAtmosphere,
  onSelectAtmosphere,
  metrics,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-slate-700/70 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Zara Studio Settings</h2>
              <p className="text-xs text-slate-400">Personalize voice tone, aura themes & audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-6">
          {/* Voice Personality Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Voice Tone Persona
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelectVoice(v.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                        : 'bg-slate-850/50 border-slate-700/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{v.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mb-2">{v.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {v.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              * Voice change takes effect immediately on new connection.
            </p>
          </div>

          {/* Visual Aura Themes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Visual Aura Theme
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-white text-white'
                        : 'bg-slate-850/40 border-slate-700/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${theme.color} shrink-0`} />
                    <span className="text-xs font-medium truncate">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ambient Background Sounds */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Procedural Ambient Audio
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['off', 'rain', 'cyberpunk_lofi', 'cafe', 'deep_space'] as AtmosphereSound[]).map((snd) => {
                const isSelected = currentAtmosphere === snd;
                return (
                  <button
                    key={snd}
                    onClick={() => onSelectAtmosphere(snd)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    {snd.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diagnostics */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Engine Telemetry</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
              <div>
                Model: <span className="text-slate-200">{metrics.activeModel || 'gemini-3.1-flash-live'}</span>
              </div>
              <div>
                Latency:{' '}
                <span className={metrics.latencyMs < 150 ? 'text-emerald-400' : 'text-amber-400'}>
                  {metrics.latencyMs > 0 ? `${metrics.latencyMs}ms` : 'Syncing'}
                </span>
              </div>
              <div>
                Packets Sent: <span className="text-slate-200">{metrics.audioPacketsSent}</span>
              </div>
              <div>
                Packets Recv: <span className="text-slate-200">{metrics.audioPacketsReceived}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
