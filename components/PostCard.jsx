'use client';

import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Award, BarChart2, Radio, Send, CheckCircle2, User } from 'lucide-react';

export default function PostCard({ post, onUpdate }) {
  const [isLiked, setIsLiked] = useState(Boolean(post.likedByMe));
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [interactionError, setInteractionError] = useState('');

  // Poll state
  const [pollData, setPollData] = useState(post.poll);
  const [hasVoted, setHasVoted] = useState(Boolean(post.poll?.userVoteId));
  const [selectedOptionId, setSelectedOptionId] = useState(post.poll?.userVoteId || null);

  // Handle Like
  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.status === 401) {
        window.location.assign('/login');
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to update the like.');
      }
      setLikesCount(data.likes);
      setIsLiked(data.liked);
      setInteractionError('');
    } catch (error) {
      console.error('Failed to like post:', error);
      setInteractionError(error.message || 'Unable to update the like.');
    }
  };

  // Handle Poll Vote
  const handleVote = async (optionId) => {
    if (hasVoted) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.assign('/login');
        return;
      }
      if (!res.ok || !data.success || !data.poll) {
        throw new Error(data.error || 'Unable to submit your vote.');
      }
      setPollData(data.poll);
      setHasVoted(true);
      setSelectedOptionId(optionId);
      setInteractionError('');
    } catch (error) {
      console.error('Failed to vote:', error);
      setInteractionError(error.message || 'Unable to submit your vote.');
    }
  };

  // Handle Comment Submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: commentText.trim()
        })
      });

      const data = await res.json();
      if (res.status === 401) {
        window.location.assign('/login');
        return;
      }
      if (!res.ok || !data.success || !data.comment) {
        throw new Error(data.error || 'Unable to submit your comment.');
      }
      setComments([...comments, data.comment]);
      setCommentText('');
      setInteractionError('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      setInteractionError(error.message || 'Unable to submit your comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Format relative date
  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const authorName = post.author?.name || 'Cricket Fan';
  const authorHandle = post.author?.handle ? `@${post.author.handle}` : '';
  const authorBadge = post.author?.badge;
  const avatarBg = post.author?.avatarBg || 'from-emerald-600 to-teal-600';

  const totalPollVotes = pollData?.totalVotes || 0;

  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 mb-5">
      
      {/* Header: Author, Type Badge, Tagged Match */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0`}>
            {authorName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-gray-900">{authorName}</span>
              {authorHandle && (
                <span className="text-gray-400 text-xs hidden sm:inline">{authorHandle}</span>
              )}
              {authorBadge && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-gray-100 text-gray-600 rounded">
                  {authorBadge}
                </span>
              )}
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-gray-400 text-xs">{formatTime(post.createdAt)}</span>
            </div>
            
            {post.matchTag && (
              <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                {post.matchTag}
              </span>
            )}
          </div>
        </div>

        {/* Type Badge */}
        {post.type === 'article' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
            <Award className="w-3.5 h-3.5" />
            Article
          </span>
        ) : post.type === 'poll' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            <BarChart2 className="w-3.5 h-3.5" />
            Fan Poll
          </span>
        ) : (
          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
            Discussion
          </span>
        )}
      </div>

      {/* Article Title */}
      {post.title && (
        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
          {post.title}
        </h3>
      )}

      {/* Main Content */}
      <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-line mb-4">
        {post.content}
      </div>

      {/* Poll Section (if applicable) */}
      {post.type === 'poll' && pollData?.options && (
        <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Community Poll</span>
            <span>{totalPollVotes} {totalPollVotes === 1 ? 'vote' : 'votes'} total</span>
          </div>

          {pollData.options.map((opt) => {
            const percentage = totalPollVotes > 0 ? Math.round(((opt.votes || 0) / totalPollVotes) * 100) : 0;
            const isUserSelection = selectedOptionId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleVote(opt.id)}
                disabled={hasVoted}
                className={`relative w-full text-left p-3 rounded-lg border transition-all overflow-hidden ${
                  hasVoted
                    ? isUserSelection
                      ? 'border-amber-500 bg-amber-50/40 font-semibold'
                      : 'border-gray-200 bg-white'
                    : 'border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50/20 cursor-pointer'
                }`}
              >
                {/* Progress bar fill */}
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-200/60 transition-all duration-500 pointer-events-none"
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between z-10 text-xs">
                  <div className="flex items-center gap-2">
                    {hasVoted && isUserSelection && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span className="text-gray-800">{opt.text}</span>
                  </div>
                  {hasVoted && (
                    <span className="font-bold text-gray-700 ml-2">
                      {percentage}% ({opt.votes || 0})
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Topic Tag */}
      {post.topic && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md hover:bg-emerald-100 cursor-pointer">
            {post.topic.startsWith('#') ? post.topic : `#${post.topic}`}
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs font-semibold text-gray-600">
        <div className="flex items-center gap-4">
          {/* Like button */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${
              isLiked ? 'text-rose-500' : 'hover:text-rose-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comment toggle button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{comments.length}</span>
          </button>
        </div>
        {interactionError && (
          <p role="alert" className="mt-3 text-xs font-medium text-red-600">
            {interactionError}
          </p>
        )}

        {/* Share */}
        <button
          onClick={() => {
            if (navigator?.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert('Post link copied to clipboard!');
            }
          }}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
          title="Share Post"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Comment Section (Collapsible) */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          
          {/* Add comment form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Join the discussion..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">No comments yet. Be the first to reply!</p>
          ) : (
            <div className="space-y-2.5 pt-1">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50/80 rounded-xl p-3 text-xs border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-800">{comment.author}</span>
                    <span className="text-[10px] text-gray-400">{formatTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </article>
  );
}
