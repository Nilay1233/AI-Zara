import { UserProfileData, ScheduleItem, QuickActionPrompt, HumanToneStyle } from '../types/zara';

const USER_DATA_STORAGE_KEY = 'zara_user_profile_data_v1';
const QUICK_ACTIONS_STORAGE_KEY = 'zara_quick_actions_v1';

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sched-1',
    time: '09:30 AM',
    task: 'Review AI project architecture & voice latency benchmarks',
    completed: true,
    priority: 'high',
  },
  {
    id: 'sched-2',
    time: '01:30 PM',
    task: 'Deep work sprint on interactive UI visualizers',
    completed: false,
    priority: 'high',
  },
  {
    id: 'sched-3',
    time: '04:00 PM',
    task: 'Coffee break & sync on product roadmap',
    completed: false,
    priority: 'normal',
  },
  {
    id: 'sched-4',
    time: '06:00 PM',
    task: 'Daily wrap-up and plan tomorrow priorities',
    completed: false,
    priority: 'normal',
  },
];

const DEFAULT_MEMORY_NOTES: string[] = [
  'Loves dark roast pour-over coffee and matcha lattes in the afternoon.',
  'Working on real-time AI companions and modern web applications.',
  'Prefers conversations that are quick, witty, and emotionally engaging.',
  'Appreciates practical advice with a sharp sense of humor.',
];

const DEFAULT_PROFILE: UserProfileData = {
  name: 'Alex',
  role: 'Creative Tech Builder',
  tone: 'charming_playful',
  schedule: DEFAULT_SCHEDULE,
  memoryNotes: DEFAULT_MEMORY_NOTES,
  lastSessionSummary:
    'Alex and Zara explored real-time voice latency tuning, tested the 6 motion UI modes, and set up ambient focus audio.',
};

export const DEFAULT_QUICK_ACTIONS: QuickActionPrompt[] = [
  {
    id: 'qa-summarize',
    title: 'Summarize Last Interaction',
    prompt:
      'Zara, give me a quick, witty summary of what we talked about in our recent session and what key takeaways or next steps we have!',
    category: 'daily',
    icon: 'sparkles',
    description: 'Instant spoken recap of past conversation and decisions',
  },
  {
    id: 'qa-schedule',
    title: 'Check My Schedule',
    prompt:
      'Zara, check my schedule for today! Walk me through what is coming up next and give me a quick tip to stay on track.',
    category: 'daily',
    icon: 'calendar',
    description: "Reviews today's agenda, deadlines, and current focus",
  },
  {
    id: 'qa-memory',
    title: 'What Do You Remember About Me?',
    prompt:
      'Zara, what personal facts, habits, and preferences do you have stored in your memory bank about me? Show me how well you know me!',
    category: 'personality',
    icon: 'brain',
    description: 'Tests Zara’s long-term conversational memory bank',
  },
  {
    id: 'qa-wit',
    title: 'Spark of Wit & Motivation',
    prompt:
      'Zara, hit me with your sharpest witty remark or clever observation to give me a burst of energy right now!',
    category: 'personality',
    icon: 'flame',
    description: 'Charming teasing and high-energy motivational quips',
  },
  {
    id: 'qa-focus',
    title: 'Start 15-min Focus Sprint',
    prompt:
      'Zara, please set a 15-minute countdown timer for my focus sprint and play some relaxing ambient beats.',
    category: 'productivity',
    icon: 'clock',
    description: 'Triggers timer tool and focus atmosphere sound together',
  },
  {
    id: 'qa-spotify',
    title: 'Open Spotify Music',
    prompt:
      'Zara, please open Spotify for me so I can put on some great tunes to vibe to.',
    category: 'entertainment',
    icon: 'music',
    description: 'Opens Spotify web player via browser tool call',
  },
  {
    id: 'qa-brainstorm',
    title: 'Brainstorm Fresh Ideas',
    prompt:
      'Zara, let’s bounce some creative thoughts around. What is a wild, exciting idea or feature we should dream up?',
    category: 'productivity',
    icon: 'zap',
    description: 'Collaborative creative riffing with playful back-and-forth',
  },
  {
    id: 'qa-photo-gen',
    title: 'Generate AI Photo',
    prompt:
      'Zara, please generate an AI photo of a breathtaking neon cyberpunk futuristic city with glowing rain reflections and open it in the separate window!',
    category: 'entertainment',
    icon: 'sparkles',
    description: 'Generates high-res image and opens in Separate Window',
  },
  {
    id: 'qa-video-gen',
    title: 'Generate AI Video',
    prompt:
      'Zara, please generate an AI video of an iridescent cosmic nebula flowing through deep space and open it in the separate window with playback controls!',
    category: 'entertainment',
    icon: 'sparkles',
    description: 'Generates kinetic motion video and opens in Separate Window',
  },
  {
    id: 'qa-see-screen',
    title: 'See My Screen & Analyze',
    prompt:
      'Zara, look at my screen right now! Tell me what you see, summarize what is on display, and give me your thoughts.',
    category: 'productivity',
    icon: 'activity',
    description: 'Streams live screen frames to Zara for real-time vision',
  },
  {
    id: 'qa-open-studio',
    title: 'Open Media Studio App',
    prompt:
      'Zara, please open the Media Studio app window on my screen so I can create images and videos.',
    category: 'productivity',
    icon: 'sparkles',
    description: 'Launches the integrated AI Media Studio window',
  },
  {
    id: 'qa-timecheck',
    title: 'System & Local Time Check',
    prompt:
      'Zara, check our device info, current time, and let me know if our voice stream latency is humming smoothly.',
    category: 'daily',
    icon: 'activity',
    description: 'Inspects real-time clock and diagnostics',
  },
];

type Listener = (data: UserProfileData) => void;

class UserDataStoreService {
  private listeners: Set<Listener> = new Set();

  public getUserData(): UserProfileData {
    try {
      const raw = localStorage.getItem(USER_DATA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          schedule: parsed.schedule || DEFAULT_SCHEDULE,
          memoryNotes: parsed.memoryNotes || DEFAULT_MEMORY_NOTES,
        };
      }
    } catch (e) {
      console.warn('[UserDataStore] Error reading user profile:', e);
    }
    return DEFAULT_PROFILE;
  }

  public saveUserData(data: UserProfileData): void {
    try {
      localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(data));
      this.notify(data);
    } catch (e) {
      console.error('[UserDataStore] Error saving user profile:', e);
    }
  }

  public updateField<K extends keyof UserProfileData>(field: K, value: UserProfileData[K]): void {
    const current = this.getUserData();
    current[field] = value;
    this.saveUserData(current);
  }

  public addScheduleItem(task: string, time?: string, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    const current = this.getUserData();
    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      task,
      time: time || 'Today',
      completed: false,
      priority,
    };
    current.schedule = [newItem, ...current.schedule];
    this.saveUserData(current);
  }

  public toggleScheduleItem(id: string): void {
    const current = this.getUserData();
    current.schedule = current.schedule.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    this.saveUserData(current);
  }

  public removeScheduleItem(id: string): void {
    const current = this.getUserData();
    current.schedule = current.schedule.filter((item) => item.id !== id);
    this.saveUserData(current);
  }

  public deleteScheduleItem(id: string): void {
    this.removeScheduleItem(id);
  }

  public addMemoryNote(note: string): void {
    if (!note.trim()) return;
    const current = this.getUserData();
    if (!current.memoryNotes.includes(note.trim())) {
      current.memoryNotes = [note.trim(), ...current.memoryNotes];
      this.saveUserData(current);
    }
  }

  public removeMemoryNote(index: number): void {
    const current = this.getUserData();
    current.memoryNotes = current.memoryNotes.filter((_, idx) => idx !== index);
    this.saveUserData(current);
  }

  public deleteMemoryNote(index: number): void {
    this.removeMemoryNote(index);
  }

  public updateLastSessionSummary(summary: string): void {
    const current = this.getUserData();
    current.lastSessionSummary = summary;
    this.saveUserData(current);
  }

  public setTone(tone: HumanToneStyle): void {
    const current = this.getUserData();
    current.tone = tone;
    this.saveUserData(current);
  }

  public getQuickActions(): QuickActionPrompt[] {
    try {
      const raw = localStorage.getItem(QUICK_ACTIONS_STORAGE_KEY);
      if (raw) {
        const custom: QuickActionPrompt[] = JSON.parse(raw);
        // Merge defaults with custom actions
        return [...DEFAULT_QUICK_ACTIONS, ...custom];
      }
    } catch (e) {
      console.warn('[UserDataStore] Error reading quick actions:', e);
    }
    return DEFAULT_QUICK_ACTIONS;
  }

  public addCustomQuickAction(action: Omit<QuickActionPrompt, 'id'>): QuickActionPrompt {
    const customList = this.getCustomQuickActions();
    const newAction: QuickActionPrompt = {
      ...action,
      id: `custom-qa-${Date.now()}`,
      isCustom: true,
    };
    const updated = [newAction, ...customList];
    try {
      localStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('[UserDataStore] Error saving custom action:', e);
    }
    return newAction;
  }

  public removeQuickAction(id: string): void {
    const customList = this.getCustomQuickActions().filter((a) => a.id !== id);
    try {
      localStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(customList));
    } catch (e) {
      console.error('[UserDataStore] Error updating custom actions:', e);
    }
  }

  private getCustomQuickActions(): QuickActionPrompt[] {
    try {
      const raw = localStorage.getItem(QUICK_ACTIONS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(data: UserProfileData): void {
    this.listeners.forEach((l) => {
      try {
        l(data);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

export const UserDataStore = new UserDataStoreService();
