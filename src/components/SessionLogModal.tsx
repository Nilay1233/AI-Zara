import React, { useState } from 'react';
import {
  X,
  History,
  Clock,
  Sparkles,
  ExternalLink,
  Volume2,
  Palette,
  Compass,
  Trash2,
  Flame,
  MessageSquare,
  Activity,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { SessionLogEntry, SessionToolEvent } from '../types/zara';
import { SessionLogger } from '../services/SessionLogger';

interface SessionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SessionLogEntry[];
  onClearLogs: () => void;
}

export const SessionLogModal: React.FC<SessionLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const [filterToolsOnly, setFilterToolsOnly] = useState<boolean>(false);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredLogs = filterToolsOnly
    ? logs.filter((l) => l.toolsTriggered.length > 0)
    : logs;

  // Aggregate Metrics
  const totalDuration = logs.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const totalTools = logs.reduce((acc, curr) => acc + curr.toolsTriggered.length, 0);
  const totalTurns = logs.reduce((acc, curr) => acc + curr.turnCount, 0);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'openWebsite':
        return <ExternalLink className="w-3.5 h-3.5 text-purple-400" />;
      case 'setTimer':
        return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
      case 'playAtmosphereSound':
        return <Volume2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'changeMoodGlow':
        return <Palette className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getVibeBadge = (vibe: SessionLogEntry['vibe']) => {
    switch (vibe) {
      case 'Playful & Witty':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'Curious & Smart':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Relaxed Focus':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 border border-slate-700/70 p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-900/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Session Journal</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-normal">
                  {logs.length} logged
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Recent conversational interactions, durations & tool telemetry
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

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-3 gap-2.5 my-4 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Time</span>
            </div>
            <p className="text-base sm:text-lg font-mono font-bold text-white">
              {SessionLogger.formatDuration(totalDuration)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Actions Run</span>
            </div>
            <p className="text-base sm:text-lg font-mono font-bold text-white">
              {totalTools} tools
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Conversations</span>
            </div>
            <p className="text-base sm:text-lg font-mono font-bold text-white">
              {logs.length} sessions
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterToolsOnly(false)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !filterToolsOnly
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                  : 'bg-slate-850/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setFilterToolsOnly(true)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filterToolsOnly
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                  : 'bg-slate-850/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              Tools Triggered ({logs.filter((l) => l.toolsTriggered.length > 0).length})
            </button>
          </div>

          {logs.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClearLogs();
                      setConfirmClear(false);
                    }}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <History className="w-10 h-10 stroke-1 text-slate-600 mb-2" />
              <p className="text-sm font-medium">No sessions logged yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Completed voice interactions with Zara will record here automatically.
              </p>
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={log.id}
                className="relative p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
              >
                {/* Top Row: Time, Duration & Vibe */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {SessionLogger.formatRelativeTime(log.startTime)}
                    </span>
                    <span className="text-[11px] text-slate-500">•</span>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{SessionLogger.formatDuration(log.durationSeconds)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getVibeBadge(
                        log.vibe
                      )}`}
                    >
                      {log.vibe}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {log.voiceName}
                    </span>
                  </div>
                </div>

                {/* Turns & Actions Summary */}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-500" />
                    <span>{log.turnCount} turns</span>
                  </span>
                  <span>•</span>
                  <span>
                    {log.toolsTriggered.length === 0
                      ? 'Pure voice session'
                      : `${log.toolsTriggered.length} tool actions`}
                  </span>
                </div>

                {/* Triggered Tools Badges */}
                {log.toolsTriggered.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Actions Executed:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {log.toolsTriggered.map((tool, tIdx) => (
                        <div
                          key={tIdx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-300 text-xs shadow-sm"
                        >
                          {getToolIcon(tool.name)}
                          <span className="font-semibold text-slate-200">{tool.label}</span>
                          {tool.detail && (
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              ({tool.detail})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            Close Journal
          </button>
        </div>
      </div>
    </div>
  );
};
