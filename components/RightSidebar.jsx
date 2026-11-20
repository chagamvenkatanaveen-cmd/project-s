'use client';

import React from 'react';
import { TrendingUp, Flame, ShieldAlert, Award, ExternalLink, Radio } from 'lucide-react';
import Link from 'next/link';

export default function RightSidebar({ liveMatches = [], onTagSelect }) {
  const trendingTopics = [
    { tag: 'BGT2024', posts: '4.2k discussions', category: 'Test Cricket' },
    { tag: 'Bumrah', posts: '12.8k discussions', category: 'Player Spotlight' },
    { tag: 'Kohli', posts: '28.1k discussions', category: 'Legend' },
    { tag: 'ChampionsTrophy', posts: '9.5k discussions', category: 'ICC Tournament' },
    { tag: 'IPL2025', posts: '15.3k discussions', category: 'Franchise League' },
    { tag: 'WTCFinal', posts: '3.1k discussions', category: 'Standings' }
  ];

  return (
    <aside className="space-y-5">
      
      {/* Live matches widget on the sidebar for quick glance */}
      {liveMatches && liveMatches.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900">
                Live In Progress
              </h3>
            </div>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {liveMatches.length} Active
            </span>
          </div>

          <div className="space-y-2.5">
            {liveMatches.slice(0, 3).map((m) => (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className="block p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50/50 border border-gray-100 hover:border-emerald-200 transition-all group"
              >
                <div className="text-[11px] font-semibold text-gray-500 flex justify-between">
                  <span>{m.seriesName || m.format}</span>
                  <span className="text-emerald-600 font-bold group-hover:underline">View Card &rarr;</span>
                </div>
                <div className="font-bold text-xs text-gray-900 mt-1">
                  {m.team1} vs {m.team2}
                </div>
                <div className="text-[11px] text-gray-600 truncate mt-0.5">
                  {m.score1 || m.score2 ? `${m.score1 || ''} | ${m.score2 || ''}` : m.status}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Cricket Topics */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3.5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900">
            Trending Cricket Topics
          </h3>
        </div>

        <div className="space-y-3">
          {trendingTopics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => onTagSelect && onTagSelect(topic.tag)}
              className="w-full text-left p-2 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>{topic.category}</span>
                <Flame className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-500 transition-colors" />
              </div>
              <div className="text-sm font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                #{topic.tag}
              </div>
              <div className="text-[11px] text-gray-500">{topic.posts}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Community Guidelines Card */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-500/20 p-4">
        <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>slipcord Community</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          Welcome to slipcord! Share deep tactical analysis, post your match day reactions, vote on fan polls, and follow live cricket action.
        </p>
        <div className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
          <span>Official Cricbuzz Live Integration</span>
        </div>
      </div>

    </aside>
  );
}

