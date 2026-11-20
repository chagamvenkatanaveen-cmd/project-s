"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, RefreshCw, Zap, ExternalLink } from "lucide-react";

export default function LiveTicker({ onSelectMatchTag }) {
  const [liveList, setLiveList] = useState([]);
  const [upcomingList, setUpcomingList] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [viewFilter, setViewFilter] = useState('live'); // 'live' | 'all' | 'recent'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveScores = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/matches", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setLiveList(json.data.live || []);
          setUpcomingList(json.data.upcoming || []);
          setCompletedList(json.data.completed || []);
          
          // If no live matches, default to showing recent
          if ((json.data.live || []).length === 0) {
            setViewFilter('all');
          }
        }
      }
    } catch (e) {
      console.error("Live ticker fetch error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 15000);
    return () => clearInterval(interval);
  }, []);

  let displayed = [];
  if (viewFilter === 'live') {
    displayed = liveList.length > 0 ? liveList : [...completedList, ...upcomingList];
  } else if (viewFilter === 'recent') {
    displayed = completedList;
  } else {
    displayed = [...liveList, ...upcomingList, ...completedList];
  }

  return (
    <div className="bg-[#0b1120] text-white border-b border-slate-800 text-xs select-none sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        
        {/* Left Live Indicator & Toggles */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              {liveList.length > 0 ? `${liveList.length} Live` : 'Live Scores'}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewFilter('live')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                viewFilter === 'live'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                viewFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewFilter('recent')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                viewFilter === 'recent'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Results
            </button>
          </div>
        </div>

        {/* Scrollable match ticker chips */}
        <div className="flex-1 flex items-center gap-2.5 overflow-x-auto scrollbar-none py-0.5">
          {displayed.length === 0 ? (
            <span className="text-slate-400 text-xs italic">
              Loading senior international matches from Cricbuzz...
            </span>
          ) : (
            displayed.map((m) => {
              const isLive = m.status === "live";
              const tag = `${m.teamA} vs ${m.teamB}`;

              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 transition-all ${
                    isLive
                      ? "bg-slate-900/90 border-rose-500/60 text-white shadow-sm shadow-rose-950/50"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  {/* Click to filter discussions */}
                  <div
                    onClick={() => onSelectMatchTag && onSelectMatchTag(tag)}
                    className="flex items-center gap-2 cursor-pointer group"
                    title="Click to view discussions for this match"
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <span>{m.flagA}</span>
                      <span className="group-hover:text-emerald-400 transition-colors">{m.teamA}</span>
                      <span className="text-slate-500 font-normal text-[10px]">vs</span>
                      <span className="group-hover:text-emerald-400 transition-colors">{m.teamB}</span>
                      <span>{m.flagB}</span>
                    </div>

                    <div className="flex items-center gap-1 pl-1 border-l border-slate-700/60">
                      {isLive ? (
                        <span className="text-[10px] font-black text-rose-400 bg-rose-950/80 px-1 py-0.2 rounded border border-rose-800/80 animate-pulse flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          LIVE
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {m.status === "completed" ? "FT" : "Upcoming"}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-300 max-w-[130px] truncate">
                        {m.statusNote}
                      </span>
                    </div>
                  </div>

                  {/* Direct Scorecard Link */}
                  <Link
                    href={`/match/${m.id}`}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title="Open Full Match Scorecard"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchLiveScores}
          disabled={isRefreshing}
          className="shrink-0 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Refresh scores"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
        </button>

      </div>
    </div>
  );
}
