import React from 'react';
import { Sparkles, MessageCircle, Lightbulb } from 'lucide-react';
import { ZaraState } from '../types/zara';

interface ConversationStartersProps {
  state: ZaraState;
  onSelectPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  {
    category: 'Witty & Fun',
    text: "Hey Zara, what's your take on human drama today?",
    tag: 'Charming',
  },
  {
    category: 'Roast',
    text: 'Roast my productivity in the kindest way possible!',
    tag: 'Playful',
  },
  {
    category: 'Vibes & Audio',
    text: 'Zara, play some cyberpunk lofi atmosphere and set a 15-minute focus timer.',
    tag: 'Tools',
  },
  {
    category: 'Curiosity',
    text: 'Tell me a crazy mind-bending paradox.',
    tag: 'Smart',
  },
  {
    category: 'Web',
    text: 'Open YouTube and tell me what vibes I should listen to.',
    tag: 'Browser',
  },
];

export const ConversationStarters: React.FC<ConversationStartersProps> = ({
  state,
  onSelectPrompt,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Say to Zara:</span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
          Voice Only
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {STARTER_PROMPTS.map((starter, i) => (
          <button
            key={i}
            onClick={() => onSelectPrompt(starter.text)}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-500/70 backdrop-blur-md text-left transition-all group cursor-pointer max-w-[240px]"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-medium text-slate-400 group-hover:text-purple-300">
                {starter.category}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {starter.tag}
              </span>
            </div>
            <p className="text-xs text-slate-200 group-hover:text-white line-clamp-2 leading-snug font-medium">
              "{starter.text}"
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
