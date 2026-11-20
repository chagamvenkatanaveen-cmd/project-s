'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserNavigationIcon from '@/components/UserNavigationIcon';
import {
  Bookmark,
  BookOpen,
  Building2,
  Home,
  LogOut,
  MessageCircle,
  CornerUpLeft,
  Search,
  Send,
  Settings,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

const navigationItems = [
  { label: 'Search', icon: Search, href: '/search' },
  { label: 'Applied companies', icon: Building2, href: '/applied-companies' },
  { label: 'Saved jobs', icon: Bookmark, href: '/saved-jobs' },
  { label: 'Profile', icon: UserRound, href: '/profile' },
  { label: 'Contact support', icon: MessageCircle, href: '/support' },
  { label: 'Study Materials', icon: BookOpen, href: '/study-materials' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

function formatMessageTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function SupportPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadMessages(showLoading = false) {
      if (showLoading && active) {
        setIsLoading(true);
      }

      try {
        const response = await fetch('/api/support');
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load your support conversation.');
        }
        if (active) {
          setMessages(result.messages || []);
          setError('');
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load your support conversation.');
        }
      } finally {
        if (active && showLoading) {
          setIsLoading(false);
        }
      }
    }

    loadMessages(true);
    const timer = setInterval(() => loadMessages(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    const message = content.trim();
    if (!message) {
      return;
    }

    setError('');
    setIsSending(true);
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, replyToMessageId: replyTo?.id || null }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to send your message.');
      }

      setMessages((currentMessages) => [...currentMessages, result.message]);
      setContent('');
      setReplyTo(null);
    } catch (sendError) {
      setError(sendError.message || 'Unable to send your message.');
    } finally {
      setIsSending(false);
    }
  }

  function handleMessageKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function handleDeleteMessage() {
    if (!messageToDelete) {
      return;
    }

    const deletedMessageId = messageToDelete.id;
    setError('');
    setIsDeletingMessage(true);
    try {
      const response = await fetch(`/api/support/${encodeURIComponent(deletedMessageId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to delete your message.');
      }

      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== deletedMessageId));
      setReplyTo((currentReply) => currentReply?.id === deletedMessageId ? null : currentReply);
      setMessageToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete your message.');
    } finally {
      setIsDeletingMessage(false);
    }
  }

  async function handleSignOut() {
    setError('');
    setIsSigningOut(true);

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to sign out.');
      }

      router.replace('/login');
      router.refresh();
    } catch (signOutError) {
      setError(signOutError.message || 'Unable to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1f2937]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[76px] flex-col items-center border-r border-[#e5e7eb] bg-white py-5 md:flex">
        <div aria-hidden="true" className="mb-9 h-11 w-11" />
        <nav aria-label="Main navigation" className="flex flex-1 flex-col items-center gap-3">
          <Link
            href="/home"
            aria-label="Home"
            title="Home"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6b7280]"
          >
            <Home size={20} />
          </Link>
          {navigationItems.map(({ label, icon: Icon, href }) => {
            const isActive = href === '/support';
            return (
              <Link
                key={label}
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                title={label}
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isActive ? 'bg-[#f3f4f6] text-[#1f2937] ring-1 ring-[#e5e7eb]' : 'text-[#6b7280]'
                }`}
              >
                <UserNavigationIcon icon={Icon} href={href} />
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <LogOut size={20} />
        </button>
      </aside>

      <header className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-5 py-3 md:hidden">
        <Link href="/home" className="font-black tracking-tight text-[#1f2937]">slipcord</Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign out"
          className="rounded-lg p-2 text-[#6b7280] disabled:opacity-50"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex min-h-screen flex-col bg-[#f7f8fa] md:ml-[76px]">
        <header className="border-b border-[#e5e7eb] bg-white px-5 py-5 sm:px-8">
          <h1 className="text-2xl font-black tracking-tight">Contact support</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Chat directly with the admin. Replies appear here automatically.</p>
        </header>

        {error && <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-8">{error}</p>}

        <section aria-label="Support messages" className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-8">
          {isLoading ? (
            <p className="text-sm text-[#6b7280]">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[#6b7280]">
              You can interact with the admin here. Send a message below to start a conversation.
            </p>
          ) : messages.map((message) => (
            <div
              key={message.id}
              className={`group flex items-center gap-2 ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.senderType === 'user' && (
                <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => setReplyTo(message)}
                    aria-label="Reply to this message"
                    title="Reply"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#64748b] hover:bg-white hover:text-[#1f2937]"
                  >
                    <CornerUpLeft size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageToDelete(message)}
                    aria-label="Delete message for everyone"
                    title="Delete for everyone"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#64748b] hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              )}
              <article className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.senderType === 'user' ? 'bg-[#1f2937] text-white' : 'bg-white text-[#1f2937]'
              }`}>
                <p className="mb-1 text-xs font-semibold opacity-75">
                  {message.senderType === 'user' ? 'You' : 'Support'}
                </p>
                {message.replyToContent && (
                  <div className="mb-2 border-l-2 border-[#25a56a] bg-black/5 px-2.5 py-1.5 text-xs">
                    <p className="font-semibold text-[#168f59]">
                      {message.replyToSenderType === 'user' ? 'You' : 'Support'}
                    </p>
                    <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words opacity-80">{message.replyToContent}</p>
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                <time className="mt-2 block text-[11px] opacity-70">{formatMessageTime(message.createdAt)}</time>
              </article>
              {message.senderType === 'admin' && (
                <button
                  type="button"
                  onClick={() => setReplyTo(message)}
                  aria-label="Reply to this message"
                  title="Reply"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#64748b] opacity-100 transition-opacity hover:bg-white hover:text-[#1f2937] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                >
                  <CornerUpLeft size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </section>

        <form onSubmit={handleSubmit} className="border-t border-[#e5e7eb] bg-white px-5 py-4 sm:px-8">
          <label htmlFor="support-message" className="sr-only">Your message</label>
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              {replyTo && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-[#25a56a] bg-[#f1f3f5] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#168f59]">
                      Replying to {replyTo.senderType === 'user' ? 'your message' : 'support'}
                    </p>
                    <p className="truncate text-xs text-[#6b7280]">{replyTo.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    aria-label="Cancel reply"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#6b7280] hover:bg-white"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              )}
              <textarea
                id="support-message"
                rows="2"
                maxLength="4000"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder="Type a message to the admin..."
                className="min-h-12 w-full resize-y rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <button
              type="submit"
              disabled={isSending || !content.trim()}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#1f2937] px-4 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} aria-hidden="true" />
              {isSending ? 'Sending' : 'Send'}
            </button>
          </div>
          <p className="mt-2 text-right text-xs text-[#9ca3af]">{content.length}/4000</p>
        </form>
      </main>
      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-own-message-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-own-message-title" className="text-lg font-bold text-[#1f2937]">Delete message for everyone?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              This message will be permanently removed from both your chat and support&apos;s chat.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                disabled={isDeletingMessage}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-[#f3f4f6] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMessage}
                disabled={isDeletingMessage}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingMessage ? 'Deleting...' : 'Delete for everyone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
