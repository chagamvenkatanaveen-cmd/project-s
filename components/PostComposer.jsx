'use client';

import React, { useState } from 'react';
import { PenTool, BarChart2, MessageSquare, Send, Sparkles, Plus, X, Tag } from 'lucide-react';

export default function PostComposer({ onPostCreated, liveMatches = [] }) {
  const [postType, setPostType] = useState('post'); // 'post' | 'article' | 'poll'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [matchTag, setMatchTag] = useState('');

  // Poll options
  const [pollOptions, setPollOptions] = useState(['Option 1', 'Option 2']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    }
  };

  const handlePollOptionChange = (idx, value) => {
    const updated = [...pollOptions];
    updated[idx] = value;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (idx) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }
    if (postType === 'article' && !title.trim()) {
      setError('Article requires a title');
      return;
    }
    if (postType === 'poll' && pollOptions.filter((option) => option.trim()).length < 2) {
      setError('A poll needs at least two non-empty options');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const firstTag = tagsInput ? tagsInput.split(',')[0].trim().replace(/^#/, '') : 'Cricket';

    const payload = {
      type: postType,
      title: postType === 'article' ? title.trim() : '',
      content: content.trim(),
      matchTag: matchTag.trim() || '',
      tag: postType === 'article' ? 'Analysis' : postType === 'poll' ? 'Community Poll' : 'Discussion',
      topic: `#${firstTag}`,
      pollOptions: postType === 'poll' ? pollOptions.filter(o => o.trim().length > 0) : []
    };

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to publish post');
      }

      setContent('');
      setTitle('');
      setTagsInput('');
      setMatchTag('');
      setPollOptions(['Option 1', 'Option 2']);
      if (onPostCreated && resData.post) {
        onPostCreated(resData.post);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 mb-6 transition-all hover:border-gray-300">
      
      {/* Type Selector Tabs */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setPostType('post')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            postType === 'post'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Quick Post
        </button>

        <button
          type="button"
          onClick={() => setPostType('article')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            postType === 'article'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Write Article / Analysis
        </button>

        <button
          type="button"
          onClick={() => setPostType('poll')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            postType === 'poll'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Fan Poll
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Posting identity and Tagging Row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-700">Posting as your Slipcord account</span>

          {/* Live match association dropdown */}
          {liveMatches && liveMatches.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Tag Live Match:</span>
              <select
                value={matchTag}
                onChange={(e) => setMatchTag(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[220px] truncate"
              >
                <option value="">-- None (General) --</option>
                {liveMatches.map((m) => (
                  <option key={m.id} value={`${m.teamA} vs ${m.teamB}`}>
                    {m.teamA} vs {m.teamB} ({m.statusNote || 'Live'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Title input for articles */}
        {postType === 'article' && (
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your article a striking headline..."
              className="w-full text-base font-bold text-gray-900 border-0 border-b border-gray-200 pb-2 focus:ring-0 focus:border-indigo-600 placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>
        )}

        {/* Post Content / Description */}
        <div>
          <textarea
            rows={postType === 'article' ? 6 : 3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === 'article'
                ? "Write your detailed tactical breakdown, match recap, or opinion piece..."
                : postType === 'poll'
                ? "Ask the cricket community a question..."
                : "What's happening in the cricket world? Share your hot takes or thoughts on today's action..."
            }
            className="w-full rounded-xl border border-gray-200 p-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 resize-y"
          />
        </div>

        {/* Poll Options builder */}
        {postType === 'poll' && (
          <div className="space-y-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-2">
              Poll Options (2 - 5)
            </span>
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 w-5 text-right">{idx + 1}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePollOption(idx)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {pollOptions.length < 5 && (
              <button
                type="button"
                onClick={handleAddPollOption}
                className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add another choice
              </button>
            )}
          </div>
        )}

        {/* Tags and Submit Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-1">
            <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Tag topic (e.g. TestCricket, Kohli, BGT, T20)"
              className="w-full text-xs text-gray-700 bg-transparent border-0 focus:ring-0 placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                postType === 'article'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : postType === 'poll'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
