import React from 'react';
import { Activity, Cpu, Radio, Zap, ShieldCheck, Wifi, Volume2 } from 'lucide-react';
import { SessionMetrics, ZaraState } from '../../types/zara';

interface DiagnosticsAppProps {
  metrics: SessionMetrics;
  state: ZaraState;
  micLevel: number;
  outputLevel: number;
}

export const DiagnosticsApp: React.FC<DiagnosticsAppProps> = ({
  metrics,
  state,
  micLevel,
  outputLevel,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">System & Live Telemetry</h4>
            <p className="text-[11px] text-slate-400">Real-time socket health and neural pipeline</p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
            state === 'listening' || state === 'speaking'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
              : state === 'connecting'
              ? 'bg-amber-950 text-amber-300 border-amber-700'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {state}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Model Engine</span>
          <p className="text-xs font-bold text-cyan-300 mt-0.5 truncate">{metrics.activeModel}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Ping Latency</span>
          <p className="text-xs font-bold text-emerald-300 mt-0.5 font-mono">{metrics.latencyMs || 24} ms</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Session Time</span>
          <p className="text-xs font-bold text-purple-300 mt-0.5 font-mono">{metrics.sessionDuration}s</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Packets Sent</span>
          <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono">{metrics.audioPacketsSent}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Packets Rcvd</span>
          <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono">{metrics.audioPacketsReceived}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Sample Rate</span>
          <p className="text-xs font-bold text-amber-300 mt-0.5 font-mono">16kHz In / 24kHz Out</p>
        </div>
      </div>

      {/* Live Audio Meter Bars */}
      <div className="mt-4 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Microphone Input (Mic In)</span>
            <span className="font-mono text-cyan-400">{Math.round(micLevel * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, micLevel * 100))}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Zara AI Voice Output (Speaker Out)</span>
            <span className="font-mono text-purple-400">{Math.round(outputLevel * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, outputLevel * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
