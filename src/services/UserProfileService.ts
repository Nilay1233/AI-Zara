import { SessionLogger } from './SessionLogger';

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  completed?: boolean;
}

export interface UserProfile {
  name: string;
  toneStyle: 'charming_playful' | 'empathetic_warm' | 'witty_bold' | 'crisp_pro';
  schedule: ScheduleItem[];
  notes: string[];
  customPrompts: Array<{ id: string; label: string; prompt: string; icon?: string }>;
}

const STORAGE_KEY = 'zara_user_profile_v2';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Nilay',
  toneStyle: 'charming_playful',
  schedule: [
    { id: 'sc_1', time: '10:00 AM', title: 'Product Architecture Review' },
    { id: 'sc_2', time: '02:30 PM', title: 'AI Studio Demo & Voice Testing' },
    { id: 'sc_3', time: '05:00 PM', title: 'Evening Workout & Refresh' },
  ],
  notes: [
    'Building modern full-stack web apps in AI Studio',
    'Loves witty humor, sci-fi aesthetics, and fast conversational responses',
    'Prefers concise, punchy answers over robotic explanations',
  ],
  customPrompts: [
    {
      id: 'p_sum',
      label: 'Summarize Last Interaction',
      prompt: 'Zara, give me a quick, witty summary of our last conversation session.',
      icon: 'FileText',
    },
    {
      id: 'p_sched',
      label: 'Check My Schedule',
      prompt: 'Zara, check my schedule and tell me what my key priorities are today.',
      icon: 'Calendar',
    },
    {
      id: 'p_focus',
      label: '15m Refresh & Lo-Fi',
      prompt: 'Zara, start a 15-minute quick refresh timer and play some cyberpunk lofi atmosphere.',
      icon: 'Coffee',
    },
    {
      id: 'p_advice',
      label: 'Daily Witty Advice',
      prompt: 'Zara, give me your sharpest and most charming piece of advice for today.',
      icon: 'Lightbulb',
    },
    {
      id: 'p_tech',
      label: 'Trending Tech Briefing',
      prompt: 'Zara, search for the biggest trending tech news today and give me the highlights.',
      icon: 'Globe',
    },
    {
      id: 'p_roast',
      label: 'Playful Roast',
      prompt: 'Zara, roast my daily procrastination habits in the most charming way possible!',
      icon: 'Flame',
    },
  ],
};

export class UserProfileService {
  public static getProfile(): UserProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
        return DEFAULT_PROFILE;
      }
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  public static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.warn('[UserProfileService] Error saving profile:', err);
    }
  }

  public static getContextSummaryForSession(): string {
    const profile = UserProfileService.getProfile();
    const pastLogs = SessionLogger.getLogs();
    const lastSession = pastLogs.length > 0 ? pastLogs[0] : null;

    let lastSummary = 'First session or no recent logs recorded.';
    if (lastSession) {
      const tools = lastSession.toolsTriggered.map((t) => t.label).join(', ') || 'pure voice talk';
      lastSummary = `Previous session lasted ${lastSession.durationSeconds} seconds (${lastSession.turnCount} turns) with vibe "${lastSession.vibe}". Tools used: ${tools}.`;
    }

    const payload = {
      name: profile.name,
      tone: profile.toneStyle,
      schedule: profile.schedule.map((s) => `${s.time}: ${s.title}`),
      notes: profile.notes,
      lastSessionSummary: lastSummary,
    };

    return encodeURIComponent(JSON.stringify(payload));
  }
}
