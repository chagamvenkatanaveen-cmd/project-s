'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Radio, Trophy, Activity, MessageSquare } from 'lucide-react';

export default function MatchDetailClient({ id }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatchDetails = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/matches/${id}`);
      if (!res.ok) {
        throw new Error('Match details not found');
      }
      const data = await res.json();
      setMatch(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatchDetails();
    // Auto-refresh match scorecard every 15s
    const timer = setInterval(fetchMatchDetails, 15000);
    return () => clearInterval(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Loading Cricbuzz Live Scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center shadow-sm">
          <p className="text-red-600 font-bold mb-2">Failed to load match scorecard</p>
          <p className="text-xs text-gray-500 mb-4">{error || 'Unknown error'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>

          <button
            onClick={fetchMatchDetails}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Card</span>
          </button>
        </div>

        {/* Match Header Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              {match.seriesName || 'International Cricket'}
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                <Radio className="w-3 h-3 animate-pulse" />
                {match.state || 'Live'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{match.format}</span>
            </div>
          </div>

          {/* Teams & Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-sm font-semibold text-slate-300">{match.team1}</div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {match.score1 || 'Yet to Bat'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-sm font-semibold text-slate-300">{match.team2}</div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {match.score2 || 'Yet to Bat'}
              </div>
            </div>
          </div>

          {/* Status / Commentary summary */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
            <div className="font-medium text-emerald-300">
              📢 {match.status}
            </div>
            {match.venue && (
              <div className="text-slate-400">
                📍 {match.venue}
              </div>
            )}
          </div>
        </div>

        {/* Batters Scorecard Table (if present) */}
        {match.batsmen && match.batsmen.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                Current Batters
              </h3>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-5 py-2.5">Batter</th>
                    <th className="px-4 py-2.5 text-right">R</th>
                    <th className="px-4 py-2.5 text-right">B</th>
                    <th className="px-4 py-2.5 text-right">4s</th>
                    <th className="px-4 py-2.5 text-right">6s</th>
                    <th className="px-4 py-2.5 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {match.batsmen.map((b, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-bold text-gray-900">{b.name}</td>
                      <td className="px-4 py-3 text-right font-black text-gray-900">{b.runs}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{b.balls}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{b.fours}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{b.sixes}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{b.sr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bowlers Scorecard Table (if present) */}
        {match.bowlers && match.bowlers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                Bowlers
              </h3>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-5 py-2.5">Bowler</th>
                    <th className="px-4 py-2.5 text-right">O</th>
                    <th className="px-4 py-2.5 text-right">M</th>
                    <th className="px-4 py-2.5 text-right">R</th>
                    <th className="px-4 py-2.5 text-right">W</th>
                    <th className="px-4 py-2.5 text-right">ECO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {match.bowlers.map((bw, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-bold text-gray-900">{bw.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{bw.overs}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{bw.maidens}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{bw.runs}</td>
                      <td className="px-4 py-3 text-right font-black text-red-600">{bw.wickets}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{bw.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Match Social Discussion Call to Action */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Discuss this match with the cricket community
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Share your tactical views, player ratings, or live reactions on the feed.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Join Match Debate</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

