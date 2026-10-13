import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Layers, ChevronRight, RotateCw } from 'lucide-react';
import { UIMode } from '../types/zara';
import { UI_MODES_LIST } from '../config/uiModes';

interface UIModeButtonProps {
  currentMode: UIMode;
  onOpenModal: () => void;
  onCycleNext: () => void;
}

export const UIModeButton: React.FC<UIModeButtonProps> = ({
  currentMode,
  onOpenModal,
  onCycleNext,
}) => {
  const currentInfo = UI_MODES_LIST.find((m) => m.id === currentMode) || UI_MODES_LIST[0];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl shadow-lg shadow-black/40">
      {/* Primary UI Change Button */}
      <motion.button
        onClick={onOpenModal}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/40 hover:border-cyan-400/60 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm group"
        title="Open 6 UI Themes Gallery"
      >
        <span
          className="w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: currentInfo.accent }}
        />
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 group-hover:text-cyan-300">
            UI Style
          </span>
          <span className="text-xs font-bold text-white leading-none">
            {currentInfo.name}
          </span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
          6 UIs
        </span>
      </motion.button>

      {/* Quick Cycle Next Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onCycleNext();
        }}
        whileHover={{ scale: 1.1, rotate: 45 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
        title="Cycle to next UI"
        aria-label="Cycle to next UI"
      >
        <RotateCw className="w-3.5 h-3.5" />
      </motion.button>
    </div>
  );
};
