import { SessionLogEntry, VoiceName, SessionToolEvent } from '../types/zara';

const STORAGE_KEY = 'zara_session_history_v1';

const INITIAL_SEEDS: SessionLogEntry[] = [
  {
    id: 'seed_sess_1',
    startTime: Date.now() - 1000 * 60 * 35, // 35 mins ago
    endTime: Date.now() - 1000 * 60 * 32,
    durationSeconds: 164,
    voiceName: 'Aoede',
    turnCount: 5,
    toolsTriggered: [
      {
        name: 'playAtmosphereSound',
        label: 'Cyberpunk Lo-Fi',
        detail: 'Atmospheric audio background enabled',
        timestamp: Date.now() - 1000 * 60 * 34,
      },
      {
        name: 'setTimer',
        label: 'Focus Sprint',
        detail: '15-minute countdown timer set',
        timestamp: Date.now() - 1000 * 60 * 33,
      },
    ],
    vibe: 'Relaxed Focus',
  },
  {
    id: 'seed_sess_2',
    startTime: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    endTime: Date.now() - 1000 * 60 * 60 * 3 + 1000 * 195,
    durationSeconds: 195,
    voiceName: 'Aoede',
    turnCount: 7,
    toolsTriggered: [
      {
        name: 'openWebsite',
        label: 'Wikipedia',
        detail: 'Opened Grandfather Paradox article',
        timestamp: Date.now() - 1000 * 60 * 60 * 3 + 1000 * 60,
      },
      {
        name: 'changeMoodGlow',
        label: 'Cyan Pulse',
        detail: 'Aura glow shifted to holographic cyan',
        timestamp: Date.now() - 1000 * 60 * 60 * 3 + 1000 * 110,
      },
    ],
    vibe: 'Curious & Smart',
  },
];

export class SessionLogger {
  public static getLogs(): SessionLogEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDS));
        return INITIAL_SEEDS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_SEEDS;
    }
  }

  public static addLog(log: SessionLogEntry): void {
    try {
      const existing = SessionLogger.getLogs();
      const updated = [log, ...existing].slice(0, 30); // Keep last 30 sessions
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[SessionLogger] Error saving log:', err);
    }
  }

  public static clearLogs(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {}
  }

  public static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  public static formatRelativeTime(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay}d ago`;
  }
}
