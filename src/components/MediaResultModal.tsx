import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Share2,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Film,
  Image as ImageIcon,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GeneratedMediaItem, MediaType } from '../types/zara';

interface MediaResultModalProps {
  isOpen: boolean;
  mediaItem: GeneratedMediaItem | null;
  onClose: () => void;
  onRegenerate?: (prompt: string, type: MediaType) => void;
}

export const MediaResultModal: React.FC<MediaResultModalProps> = ({
  isOpen,
  mediaItem,
  onClose,
  onRegenerate,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Reset states when item changes
    setIsPlaying(true);
    setZoomLevel(1);
    setVideoProgress(0);
  }, [mediaItem?.id]);

  if (!isOpen || !mediaItem) return null;

  const isVideo = mediaItem.type === 'video';

  const handleDownload = () => {
    if (!mediaItem.url) return;
    const a = document.createElement('a');
    a.href = mediaItem.url;
    a.download = isVideo
      ? `zara-video-${Date.now()}.webm`
      : `zara-photo-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(mediaItem.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 1;
    setVideoProgress((current / total) * 100);
    setVideoDuration(total);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekPercent = parseFloat(e.target.value);
    const newTime = (seekPercent / 100) * (videoRef.current.duration || 1);
    videoRef.current.currentTime = newTime;
    setVideoProgress(seekPercent);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`relative flex flex-col bg-slate-950/95 border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden transition-all duration-300 ${
            isFullscreen
              ? 'w-full h-full max-w-none rounded-none'
              : 'w-full max-w-4xl max-h-[92vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  isVideo
                    ? 'bg-purple-950/70 border-purple-500/50 text-purple-300'
                    : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                }`}
              >
                {isVideo ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    {isVideo ? 'AI Video Output' : 'AI Photo Output'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    SEPARATE WINDOW
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {mediaItem.model || 'Zara Neural Studio'} • {mediaItem.aspectRatio || '1:1'}
                </p>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Maximize window'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                title="Download media file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
                title="Close window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Viewport Canvas */}
          <div className="relative flex-1 bg-black/90 flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[420px] max-h-[64vh]">
            {isVideo ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  src={mediaItem.url}
                  autoPlay
                  loop
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  className="max-h-[58vh] max-w-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />

                {/* Floating Play Indicator overlay */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 border border-white/30 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Play className="w-7 h-7 ml-1" />
                  </button>
                )}

                {/* Video Scrubber & Playback Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={videoProgress}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <span className="font-mono text-[11px] text-slate-400">
                        {((videoProgress / 100) * videoDuration).toFixed(1)}s / {videoDuration.toFixed(1)}s
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">AI MOTION ACTIVE</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-2 overflow-auto">
                <img
                  src={mediaItem.url}
                  alt={mediaItem.prompt}
                  style={{ transform: `scale(${zoomLevel})` }}
                  className="max-h-[58vh] max-w-full object-contain transition-transform duration-200 select-none rounded-lg shadow-2xl"
                />

                {/* Photo Zoom Float Controls */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-700/80 backdrop-blur-md rounded-xl text-slate-300">
                  <button
                    onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.25))}
                    className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.25))}
                    className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prompt & Details Footer */}
          <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generation Prompt</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 font-sans leading-relaxed">
                  {mediaItem.prompt}
                </p>
              </div>

              <button
                onClick={handleCopyPrompt}
                className="self-center flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick iteration tags */}
            {onRegenerate && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400 overflow-x-auto">
                <span className="shrink-0">Iterate with Zara:</span>
                <button
                  onClick={() => onRegenerate(`${mediaItem.prompt}, cyberpunk neon aesthetics`, mediaItem.type)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-200 border border-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  + Cyberpunk Glow
                </button>
                <button
                  onClick={() => onRegenerate(`${mediaItem.prompt}, cinematic hyper-detailed 4k`, mediaItem.type)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-900/60 hover:text-purple-200 border border-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  + 4K Cinematic
                </button>
                <button
                  onClick={() => onRegenerate(`${mediaItem.prompt}, futuristic holographic minimalism`, mediaItem.type)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-200 border border-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  + Minimal Hologram
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
