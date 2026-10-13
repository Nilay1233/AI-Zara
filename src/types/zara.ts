export type ZaraState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export type VoiceName = 'Aoede' | 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export type GlowTheme = 'violet_neon' | 'cyan_pulse' | 'amber_gold' | 'emerald_zen' | 'crimson_flame';

export type AtmosphereSound = 'rain' | 'cyberpunk_lofi' | 'cafe' | 'deep_space' | 'off';

export interface WebsiteAction {
  id: string;
  url: string;
  title: string;
  reason?: string;
  timestamp: number;
}

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

export interface ToolCallItem {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  result?: any;
}

export interface SessionMetrics {
  latencyMs: number;
  sessionDuration: number;
  activeModel: string;
  audioPacketsSent: number;
  audioPacketsReceived: number;
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  description: string;
  tags: string[];
}

export interface SessionToolEvent {
  name: string;
  label: string;
  detail?: string;
  timestamp: number;
}

export interface SessionLogEntry {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  voiceName: VoiceName;
  turnCount: number;
  toolsTriggered: SessionToolEvent[];
  vibe: 'Playful & Witty' | 'Curious & Smart' | 'Relaxed Focus' | 'Quick Check-in';
}

export type UIMode =
  | 'classic'    // 1. Classic Studio (Old UI)
  | 'hologram'   // 2. Hologram Deck (New UI)
  | 'cyberpunk'  // 3. Cyberpunk Noir
  | 'aurora'     // 4. Liquid Aurora
  | 'minimal'    // 5. Zen Minimalist
  | 'cosmic';    // 6. Cosmic Space

export interface UIModeInfo {
  id: UIMode;
  name: string;
  family: 'Old UI' | 'New UI';
  tagline: string;
  accent: string;
  glow: string;
  badge: string;
}

export type HumanToneStyle =
  | 'charming_playful'
  | 'warm_empathic'
  | 'energetic_sassy'
  | 'calm_intellectual';

export interface ScheduleItem {
  id: string;
  time?: string;
  task: string;
  completed: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export interface UserProfileData {
  name: string;
  role?: string;
  tone: HumanToneStyle;
  schedule: ScheduleItem[];
  memoryNotes: string[];
  lastSessionSummary: string;
}

export interface QuickActionPrompt {
  id: string;
  title: string;
  prompt: string;
  category: 'daily' | 'productivity' | 'personality' | 'entertainment' | 'custom';
  icon: string;
  description?: string;
  isCustom?: boolean;
}

// Virtual Apps Ecosystem
export type AppId =
  | 'media_studio'   // Photo & Video generation studio
  | 'screen_vision'  // Live screen share and vision analyzer
  | 'notes'          // Scratchpad & memory notes
  | 'soundboard'     // Atmosphere sound and music player
  | 'schedule'       // Daily planner & tasks
  | 'browser'        // Web previewer & search
  | 'diagnostics';   // System telemetry & voice stats

export interface AppWindowConfig {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  initialData?: any;
}

// Media Generation Types
export type MediaType = 'image' | 'video';

export interface GeneratedMediaItem {
  id: string;
  type: MediaType;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio?: string;
  model?: string;
  status: 'ready' | 'generating' | 'failed';
  error?: string;
}

// Screen Sharing & Vision Types
export interface ScreenShareState {
  isActive: boolean;
  resolution: string;
  fps: number;
  lastFrameTimestamp: number;
  frameCount: number;
  isAnalyzing: boolean;
  lastObservation?: string;
}

