import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Image as ImageIcon,
  Send,
  Loader2,
  Ratio,
  Palette,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { GeneratedMediaItem, MediaType } from '../../types/zara';

interface MediaStudioAppProps {
  onGenerate: (prompt: string, type: MediaType, aspectRatio: string) => Promise<void>;
  isGenerating: boolean;
  history: GeneratedMediaItem[];
  onOpenResult: (item: GeneratedMediaItem) => void;
}

export const MediaStudioApp: React.FC<MediaStudioAppProps> = ({
  onGenerate,
  isGenerating,
  history,
  onOpenResult,
}) => {
  const [prompt, setPrompt] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('Cyberpunk Neon');

  const styles = [
    'Cyberpunk Neon',
    'Cinematic 4K',
    'Hologram Sci-Fi',
    'Anime Aesthetic',
    'Hyper-realistic Portrait',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    const finalPrompt = selectedStyle
      ? `${prompt.trim()}, ${selectedStyle.toLowerCase()} style`
      : prompt.trim();
    onGenerate(finalPrompt, mediaType, aspectRatio);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      {/* Studio Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">AI Media & Kinetic Studio</h4>
            <p className="text-[11px] text-slate-400">Generate Photos & Videos with Zara</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
          Veo & Imagen Neural
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        {/* Type Toggle: Photo vs Video */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMediaType('image');
              if (aspectRatio === '16:9') setAspectRatio('1:1');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mediaType === 'image'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Generate Photo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMediaType('video');
              setAspectRatio('16:9');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mediaType === 'video'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Generate Video</span>
          </button>
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mediaType === 'image'
                ? 'Describe the photo... e.g., A glowing cybernetic phoenix hovering over Tokyo neon streets'
                : 'Describe the video... e.g., Time-lapse of aurora borealis shifting colors over icy mountains'
            }
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs sm:text-sm text-slate-100 placeholder-slate-500 resize-none outline-none transition-all"
          />
        </div>

        {/* Aspect Ratio & Style Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Ratio className="w-3 h-3" /> Ratio:
            </span>
            {['1:1', '16:9', '9:16'].map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-slate-700 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Palette className="w-3 h-3" /> Style:
            </span>
            {styles.slice(0, 3).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStyle(st === selectedStyle ? '' : st)}
                className={`px-2 py-0.5 rounded-full text-[10px] transition-all cursor-pointer ${
                  selectedStyle === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className={`w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
            isGenerating
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : mediaType === 'video'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/30'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/30'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating {mediaType === 'video' ? 'Kinetic Video' : 'Photo'}...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                Generate {mediaType === 'video' ? 'AI Video' : 'AI Photo'} & Open in Separate Window
              </span>
            </>
          )}
        </button>
      </form>

      {/* Recent Generations Gallery */}
      <div className="mt-6 flex-1 flex flex-col">
        <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Recent Outputs ({history.length})</span>
          <span className="text-[10px] font-mono text-cyan-400">Click to pop out window</span>
        </h5>

        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-2xl text-center">
            <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 font-medium">No media generated yet</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Tell Zara "Generate a photo of..." or enter a prompt above to auto-open in a separate window!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpenResult(item)}
                className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-500/70 bg-slate-900 cursor-pointer transition-all aspect-video"
              >
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    muted
                    loop
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2 flex flex-col justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="self-start px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 text-cyan-300 border border-white/10">
                    {item.type === 'video' ? 'VIDEO' : 'PHOTO'}
                  </span>
                  <p className="text-[10px] text-white font-medium line-clamp-1 group-hover:text-cyan-300">
                    {item.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
