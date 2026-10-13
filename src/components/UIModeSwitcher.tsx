import React from 'react';
import { Sparkles, Disc } from 'lucide-react';
import { UIMode } from '../types/zara';

interface UIModeSwitcherProps {
  mode: UIMode;
  onChange: (mode: UIMode) => void;
}

export const UIModeSwitcher: React.FC<UIModeSwitcherProps> = ({ mode, onChange }) => {
  const isOldUI = mode === 'classic';

  return (
    <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-700/70 backdrop-blur-md shadow-lg shadow-black/40">
      <button
        onClick={() => onChange('classic')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
          isOldUI
            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        title="Classic Orb & Soundwave Interface"
        aria-pressed={isOldUI}
      >
        <Disc className="w-3.5 h-3.5" />
        <span>Old UI</span>
      </button>

      <button
        onClick={() => onChange('hologram')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
          !isOldUI
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        title="Next-Gen Interface with Motion"
        aria-pressed={!isOldUI}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>New UI</span>
      </button>
    </div>
  );
};
