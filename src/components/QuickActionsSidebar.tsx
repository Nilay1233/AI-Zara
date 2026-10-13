import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  Clock,
  Brain,
  Flame,
  Music,
  Zap,
  Activity,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  User,
  Heart,
  Smile,
  MessageSquare,
  Play,
  RotateCcw,
  Sliders,
  ChevronRight,
  Bookmark,
  Check,
} from 'lucide-react';
import {
  ZaraState,
  VoiceName,
  UserProfileData,
  ScheduleItem,
  QuickActionPrompt,
  HumanToneStyle,
} from '../types/zara';
import { UserDataStore } from '../services/UserDataStore';

interface QuickActionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  state: ZaraState;
  selectedVoice: VoiceName;
  onTriggerQuickAction: (prompt: string, title: string) => void;
  onSelectVoice: (voice: VoiceName) => void;
}

export const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({
  isOpen,
  onClose,
  state,
  selectedVoice,
  onTriggerQuickAction,
  onSelectVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'schedule' | 'profile'>('actions');
  const [userData, setUserData] = useState<UserProfileData>(() => UserDataStore.getUserData());
  const [quickActions, setQuickActions] = useState<QuickActionPrompt[]>(() =>
    UserDataStore.getQuickActions()
  );
  const [activeTriggerId, setActiveTriggerId] = useState<string | null>(null);

  // New action form state
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionPrompt, setNewActionPrompt] = useState('');
  const [newActionCategory, setNewActionCategory] = useState<QuickActionPrompt['category']>('daily');
  const [newActionIcon, setNewActionIcon] = useState('sparkles');

  // New schedule form state
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newScheduleTask, setNewScheduleTask] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');

  // New memory note state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Subscribe to UserDataStore changes
  useEffect(() => {
    const unsub = UserDataStore.subscribe((updated) => {
      setUserData({ ...updated });
    });
    return unsub;
  }, []);

  const handleActionClick = (action: QuickActionPrompt) => {
    setActiveTriggerId(action.id);
    onTriggerQuickAction(action.prompt, action.title);
    setTimeout(() => {
      setActiveTriggerId(null);
    }, 1800);
  };

  const handleCreateCustomAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim() || !newActionPrompt.trim()) return;

    UserDataStore.addCustomQuickAction({
      title: newActionTitle.trim(),
      prompt: newActionPrompt.trim(),
      category: newActionCategory,
      icon: newActionIcon,
      description: 'Custom voice shortcut',
    });

    setQuickActions(UserDataStore.getQuickActions());
    setNewActionTitle('');
    setNewActionPrompt('');
    setIsAddingAction(false);
  };

  const handleDeleteAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    UserDataStore.removeQuickAction(id);
    setQuickActions(UserDataStore.getQuickActions());
  };

  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleTask.trim()) return;
    UserDataStore.addScheduleItem(newScheduleTask.trim(), newScheduleTime.trim() || undefined);
    setNewScheduleTask('');
    setNewScheduleTime('');
    setIsAddingSchedule(false);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    UserDataStore.addMemoryNote(newNoteText.trim());
    setNewNoteText('');
    setIsAddingNote(false);
  };

  const handleToneChange = (tone: HumanToneStyle) => {
    UserDataStore.setTone(tone);
  };

  const renderIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'calendar':
        return <Calendar className={className} />;
      case 'clock':
        return <Clock className={className} />;
      case 'brain':
        return <Brain className={className} />;
      case 'flame':
        return <Flame className={className} />;
      case 'music':
        return <Music className={className} />;
      case 'zap':
        return <Zap className={className} />;
      case 'activity':
        return <Activity className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const tonePresets: { id: HumanToneStyle; name: string; desc: string; badge: string }[] = [
    {
      id: 'charming_playful',
      name: 'Charming & Playful',
      desc: 'Witty banter, light teasing, energetic warmth, and lively conversational pace.',
      badge: 'Default',
    },
    {
      id: 'warm_empathic',
      name: 'Empathetic & Warm',
      desc: 'Deeply supportive, emotionally attuned, reassuring, and gentle.',
      badge: 'Comfort',
    },
    {
      id: 'energetic_sassy',
      name: 'Energetic & Sassy',
      desc: 'Bold, spirited, humorous quips, and unstoppable enthusiasm.',
      badge: 'High Energy',
    },
    {
      id: 'calm_intellectual',
      name: 'Calm & Intellectual',
      desc: 'Reflective, articulate, thoughtful curiosity, and smooth composure.',
      badge: 'Focus',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Sidebar Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] max-w-[95vw] bg-slate-950/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col text-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Quick Actions
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                      LIVE
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Companion Memory & One-Click Prompts
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Close Quick Actions"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="px-5 py-2.5 bg-slate-900/60 border-b border-white/5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>Companion for <strong>{userData.name}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="capitalize">{state}</span>
                <span>•</span>
                <span>{selectedVoice}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-3 border-b border-white/5 flex gap-2">
              <button
                onClick={() => setActiveTab('actions')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'actions'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Voice Actions ({quickActions.length})
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'border-purple-400 text-purple-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule & Notes
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Profile & Tone
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* TAB 1: QUICK ACTIONS */}
              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Single-Click Voice Triggers
                    </span>
                    <button
                      onClick={() => setIsAddingAction(!isAddingAction)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isAddingAction ? 'Cancel' : 'Add Custom'}
                    </button>
                  </div>

                  {/* Add Custom Action Form */}
                  {isAddingAction && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleCreateCustomAction}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-3"
                    >
                      <div>
                        <label className="text-[11px] font-medium text-slate-300 block mb-1">
                          Button Title
                        </label>
                        <input
                          type="text"
                          value={newActionTitle}
                          onChange={(e) => setNewActionTitle(e.target.value)}
                          placeholder="e.g. Plan my workout"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-300 block mb-1">
                          Spoken Voice Prompt to Zara
                        </label>
                        <textarea
                          rows={2}
                          value={newActionPrompt}
                          onChange={(e) => setNewActionPrompt(e.target.value)}
                          placeholder="e.g. Zara, what exercises should I do today to stay energized?"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white resize-none"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {['sparkles', 'calendar', 'flame', 'music', 'zap', 'brain'].map((ic) => (
                            <button
                              type="button"
                              key={ic}
                              onClick={() => setNewActionIcon(ic)}
                              className={`p-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                                newActionIcon === ic
                                  ? 'bg-cyan-500 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {renderIcon(ic, 'w-3.5 h-3.5')}
                            </button>
                          ))}
                        </div>

                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                        >
                          Save Action
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* Actions Grid */}
                  <div className="space-y-2.5">
                    {quickActions.map((action) => {
                      const isTriggering = activeTriggerId === action.id;
                      return (
                        <div
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          className={`group relative p-3 rounded-2xl border transition-all cursor-pointer text-left flex items-start gap-3 select-none ${
                            isTriggering
                              ? 'bg-cyan-950/70 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[0.99]'
                              : 'bg-slate-900/60 hover:bg-slate-850/80 border-white/5 hover:border-cyan-500/30'
                          }`}
                        >
                          {/* Left Icon Pill */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                              isTriggering
                                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/40'
                                : 'bg-slate-800/90 group-hover:bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {renderIcon(action.icon)}
                          </div>

                          {/* Text info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-200">
                                {action.title}
                              </h4>
                              {action.isCustom && (
                                <button
                                  onClick={(e) => handleDeleteAction(action.id, e)}
                                  className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                                  title="Delete custom action"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mb-1">
                              "{action.prompt}"
                            </p>
                            {action.description && (
                              <p className="text-[10px] text-slate-500">
                                {action.description}
                              </p>
                            )}
                          </div>

                          {/* Quick Trigger Arrow / Spinner */}
                          <div className="shrink-0 self-center">
                            {isTriggering ? (
                              <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin block" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 transition-all">
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: SCHEDULE & MEMORY */}
              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  {/* Today's Schedule */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                          Today's Schedule & Tasks
                        </span>
                      </div>
                      <button
                        onClick={() => setIsAddingSchedule(!isAddingSchedule)}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isAddingSchedule ? 'Cancel' : 'Add Item'}
                      </button>
                    </div>

                    {/* Add Schedule Form */}
                    {isAddingSchedule && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddScheduleSubmit}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/40 space-y-2.5"
                      >
                        <div>
                          <input
                            type="text"
                            value={newScheduleTask}
                            onChange={(e) => setNewScheduleTask(e.target.value)}
                            placeholder="Task description (e.g. Design review)"
                            className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-purple-400"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newScheduleTime}
                            onChange={(e) => setNewScheduleTime(e.target.value)}
                            placeholder="Time (e.g. 02:00 PM)"
                            className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-purple-400"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {/* Schedule List */}
                    <div className="space-y-2">
                      {userData.schedule.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-900/40 rounded-xl">
                          No tasks scheduled. Tell Zara to add one!
                        </p>
                      ) : (
                        userData.schedule.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                              item.completed
                                ? 'bg-slate-900/40 border-white/5 opacity-60'
                                : 'bg-slate-900/70 border-white/5 hover:border-purple-500/30'
                            }`}
                          >
                            <button
                              onClick={() => UserDataStore.toggleScheduleItem(item.id)}
                              className="text-slate-400 hover:text-purple-400 transition-colors cursor-pointer shrink-0"
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs ${
                                  item.completed
                                    ? 'line-through text-slate-500'
                                    : 'text-slate-200'
                                }`}
                              >
                                {item.task}
                              </p>
                              {item.time && (
                                <span className="text-[10px] font-mono text-purple-300">
                                  {item.time}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => UserDataStore.removeScheduleItem(item.id)}
                              className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Personal Memory Bank */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                          Zara's Memory Bank About You
                        </span>
                      </div>
                      <button
                        onClick={() => setIsAddingNote(!isAddingNote)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isAddingNote ? 'Cancel' : 'Add Note'}
                      </button>
                    </div>

                    {isAddingNote && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddNoteSubmit}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-2"
                      >
                        <input
                          type="text"
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="e.g. Favorite drink is iced americano with oat milk"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                          required
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                          >
                            Save Memory
                          </button>
                        </div>
                      </motion.form>
                    )}

                    <div className="space-y-2">
                      {userData.memoryNotes.map((note, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-start justify-between gap-2 text-xs text-slate-300"
                        >
                          <div className="flex items-start gap-2">
                            <Bookmark className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{note}</span>
                          </div>
                          <button
                            onClick={() => UserDataStore.removeMemoryNote(idx)}
                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                            title="Remove note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROFILE & HUMAN TONE */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* User Profile Info */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 space-y-3">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      Your Profile Settings
                    </h4>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Your Name (Zara calls you this)
                        </label>
                        <input
                          type="text"
                          value={userData.name}
                          onChange={(e) => {
                            UserDataStore.updateField('name', e.target.value);
                          }}
                          className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Role / Title / Goal
                        </label>
                        <input
                          type="text"
                          value={userData.role || ''}
                          onChange={(e) => {
                            UserDataStore.updateField('role', e.target.value);
                          }}
                          placeholder="e.g. Designer, Software Engineer, Explorer"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Human Tone Tuning */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-2">
                      <Smile className="w-4 h-4 text-cyan-400" />
                      Human Conversational Tone
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Fine-tune Zara's humor, emotional variation, and speaking style.
                    </p>

                    <div className="space-y-2">
                      {tonePresets.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => handleToneChange(preset.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            userData.tone === preset.id
                              ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/10'
                              : 'bg-slate-900/50 border-white/5 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">
                              {preset.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5 font-mono">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {preset.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Voice Persona Switcher */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      Voice Model Persona
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Aoede', 'Kore', 'Puck', 'Fenrir', 'Zephyr'] as VoiceName[]).map((v) => (
                        <button
                          key={v}
                          onClick={() => onSelectVoice(v)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedVoice === v
                              ? 'bg-purple-950/70 border-purple-400 text-purple-200'
                              : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{v}</span>
                            {selectedVoice === v && <Check className="w-3.5 h-3.5 text-purple-400" />}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {v === 'Aoede'
                              ? 'Warm & Charming'
                              : v === 'Kore'
                              ? 'Calm & Soothing'
                              : v === 'Puck'
                              ? 'Cheeky & Spirited'
                              : v === 'Fenrir'
                              ? 'Deep & Resonant'
                              : 'Crisp & Modern'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Last Conversation Summary */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Saved Conversation Memory
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{userData.lastSessionSummary}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Voice Action Quick Dispatch Button */}
            <div className="px-5 py-3.5 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-xs">
              <div className="text-slate-400">
                Click any prompt to trigger Zara immediately
              </div>
              <button
                onClick={() => {
                  onTriggerQuickAction(
                    'Zara, give me a quick recap of our status and what we should work on!',
                    'Quick Catch-up'
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Catch-up Now
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
