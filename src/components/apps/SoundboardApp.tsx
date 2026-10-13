import React from 'react';
import { Volume2, VolumeX, CloudRain, Radio, Coffee, Compass, Play, Square } from 'lucide-react';
import { AtmosphereSound } from '../../types/zara';

interface SoundboardAppProps {
  currentAtmosphere: AtmosphereSound;
  onChangeAtmosphere: (sound: AtmosphereSound) => void;
}

export const SoundboardApp: React.FC<SoundboardAppProps> = ({
  currentAtmosphere,
  onChangeAtmosphere,
}) => {
  const tracks: Array<{ id: AtmosphereSound; name: string; desc: string; icon: any; color: string }> = [
    {
      id: 'rain',
      name: 'Rain Storm',
      desc: 'Gentle raindrops & soft distant thunder',
      icon: CloudRain,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'cyberpunk_lofi',
      name: 'Cyberpunk Lo-Fi',
      desc: 'Chill synthesizer pads & slow neon beats',
      icon: Radio,
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 'cafe',
      name: 'Cozy Cafe',
      desc: 'Warm ambient chatter & coffee acoustics',
      icon: Coffee,
      color: 'from-amber-600 to-orange-600',
    },
    {
      id: 'deep_space',
      name: 'Deep Cosmos',
      desc: 'Low-frequency sub-bass spatial drone',
      icon: Compass,
      color: 'from-indigo-600 to-violet-600',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Atmosphere Soundboard</h4>
            <p className="text-[11px] text-slate-400">Procedural ambient background acoustics</p>
          </div>
        </div>

        {currentAtmosphere !== 'off' && (
          <button
            onClick={() => onChangeAtmosphere('off')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 hover:text-white text-xs transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3" />
            <span>Stop All</span>
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tracks.map((track) => {
          const Icon = track.icon;
          const isActive = currentAtmosphere === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onChangeAtmosphere(isActive ? 'off' : track.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl bg-gradient-to-tr ${track.color} text-white shadow-md`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{track.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{track.desc}</p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                    isActive ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isActive ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 ml-0.5" />}
                </div>
              </div>

              {/* Animated Equalizer Wave Bars when Active */}
              {isActive && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase">Acoustic Active</span>
                  <div className="flex items-end gap-1 h-3.5">
                    {[0.8, 0.4, 0.9, 0.6, 1, 0.5, 0.7].map((height, i) => (
                      <span
                        key={i}
                        className="w-1 bg-cyan-400 rounded-full animate-pulse"
                        style={{
                          height: `${height * 100}%`,
                          animationDelay: `${i * 120}ms`,
                          animationDuration: '600ms',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
