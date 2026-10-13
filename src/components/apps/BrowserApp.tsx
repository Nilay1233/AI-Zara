import React, { useState } from 'react';
import { Globe, Search, ExternalLink, ArrowRight, Compass } from 'lucide-react';
import { WebsiteAction } from '../../types/zara';

interface BrowserAppProps {
  recentWebsites: WebsiteAction[];
  onOpenUrl: (url: string, title: string) => void;
}

export const BrowserApp: React.FC<BrowserAppProps> = ({ recentWebsites, onOpenUrl }) => {
  const [query, setQuery] = useState('');

  const bookmarks = [
    { title: 'Google Gemini', url: 'https://gemini.google.com', category: 'AI' },
    { title: 'Google Maps', url: 'https://maps.google.com', category: 'Navigation' },
    { title: 'YouTube', url: 'https://youtube.com', category: 'Media' },
    { title: 'GitHub', url: 'https://github.com', category: 'Dev' },
    { title: 'Wikipedia', url: 'https://wikipedia.org', category: 'Knowledge' },
    { title: 'Weather Radar', url: 'https://weather.com', category: 'Forecast' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
    onOpenUrl(url, `Search: "${query.trim()}"`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Web Explorer & Search</h4>
            <p className="text-[11px] text-slate-400">Launch and browse external links with Zara</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search web or enter URL..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
        >
          <span>Search</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </form>

      <div className="mt-4">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          Quick Portals
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {bookmarks.map((bm, i) => (
            <a
              key={i}
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenUrl(bm.url, bm.title)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between group transition-all text-xs"
            >
              <div>
                <p className="font-semibold text-white group-hover:text-blue-300">{bm.title}</p>
                <p className="text-[10px] text-slate-500">{bm.category}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-blue-400" />
            </a>
          ))}
        </div>
      </div>

      {recentWebsites.length > 0 && (
        <div className="mt-4 flex-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Recently Opened Links ({recentWebsites.length})
          </span>
          <div className="flex flex-col gap-2">
            {recentWebsites.map((w) => (
              <a
                key={w.id}
                href={w.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-xs transition-all"
              >
                <div>
                  <p className="font-semibold text-white">{w.title}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-xs">{w.url}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
