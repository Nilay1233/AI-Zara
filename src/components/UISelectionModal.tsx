import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Check,
  Disc,
  Radio,
  Zap,
  Waves,
  Minus,
  Orbit,
  ArrowRight,
} from 'lucide-react';
import { UIMode } from '../types/zara';
import { UI_MODES_LIST } from '../config/uiModes';

interface UISelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: UIMode;
  onSelectMode: (mode: UIMode) => void;
}

export const UISelectionModal: React.FC<UISelectionModalProps> = ({
  isOpen,
  onClose,
  activeMode,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  const getModeIcon = (mode: UIMode) => {
    switch (mode) {
      case 'classic':
        return <Disc className="w-5 h-5 text-purple-400" />;
      case 'hologram':
        return <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />;
      case 'cyberpunk':
        return <Zap className="w-5 h-5 text-pink-400" />;
      case 'aurora':
        return <Waves className="w-5 h-5 text-emerald-400" />;
      case 'minimal':
        return <Minus className="w-5 h-5 text-zinc-300" />;
      case 'cosmic':
        return <Orbit className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getPreviewGradient = (mode: UIMode) => {
    switch (mode) {
      case 'classic':
        return 'from-purple-950 via-slate-900 to-indigo-950 border-purple-500/40';
      case 'hologram':
        return 'from-cyan-950 via-slate-900 to-blue-950 border-cyan-400/50';
      case 'cyberpunk':
        return 'from-fuchsia-950 via-slate-950 to-pink-950 border-pink-500/50';
      case 'aurora':
        return 'from-emerald-950 via-teal-950 to-slate-900 border-emerald-400/50';
      case 'minimal':
        return 'from-zinc-900 via-neutral-900 to-zinc-950 border-zinc-600/40';
      case 'cosmic':
        return 'from-indigo-950 via-purple-950 to-black border-indigo-400/50';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl rounded-3xl bg-slate-900/95 border border-slate-700/80 p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Choose UI Experience</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    6 Available UIs
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Switch between Classic Old UI and 5 Next-Gen New UI themes in real-time
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid of all 6 UIs */}
          <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
            {UI_MODES_LIST.map((modeInfo) => {
              const isSelected = activeMode === modeInfo.id;
              return (
                <motion.button
                  key={modeInfo.id}
                  onClick={() => {
                    onSelectMode(modeInfo.id);
                    onClose();
                  }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-slate-900 to-slate-850 border-cyan-400/80 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  {/* Top Bar with Icon, Title, and Family Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                          {getModeIcon(modeInfo.id)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{modeInfo.name}</h3>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                              modeInfo.family === 'Old UI'
                                ? 'bg-purple-950/70 border-purple-600/50 text-purple-300'
                                : 'bg-cyan-950/70 border-cyan-600/50 text-cyan-300'
                            }`}
                          >
                            {modeInfo.badge}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/50">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      {modeInfo.tagline}
                    </p>
                  </div>

                  {/* Aesthetic Mini Preview Bar */}
                  <div
                    className={`mt-3 h-2 w-full rounded-full bg-gradient-to-r ${getPreviewGradient(
                      modeInfo.id
                    )} opacity-80`}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">
              Active: <strong className="text-white capitalize">{activeMode}</strong>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
