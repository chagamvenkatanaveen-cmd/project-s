'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bell, CornerUpLeft, MessageCircle, Search, Send, Trash2, X } from 'lucide-react';

function formatMessageTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [error, setError] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState('');
  const [chatUsers, setChatUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState('');
  const [newChatError, setNewChatError] = useState('');
  const messagesEndRef = useRef(null);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);

  useEffect(() => {
    let active = true;

    async function loadConversations(showLoading = false) {
      if (showLoading && active) {
        setIsLoading(true);
      }
      try {
        const response = await fetch('/api/admin/support');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load the support inbox.');
        }
        if (active) {
          const nextConversations = result.conversations || [];
          setConversations(nextConversations);
          setSelectedId((currentId) => nextConversations.some((conversation) => conversation.id === currentId) ? currentId : '');
          setError('');
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load the support inbox.');
        }
      } finally {
        if (active && showLoading) {
          setIsLoading(false);
        }
      }
    }

    loadConversations(true);
    const timer = setInterval(() => loadConversations(), 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setIsMessagesLoading(false);
      return undefined;
    }

    let active = true;
    async function loadMessages(showLoading = false) {
      if (showLoading && active) {
        setMessages([]);
        setIsMessagesLoading(true);
      }
      try {
        const response = await fetch(`/api/admin/support/${encodeURIComponent(selectedId)}/messages`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load this conversation.');
        }
        if (active) {
          setMessages(result.messages || []);
          setConversations((currentConversations) => currentConversations.map((conversation) => (
            conversation.id === selectedId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )));
          setError('');
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load this conversation.');
        }
      } finally {
        if (active && showLoading) {
          setIsMessagesLoading(false);
        }
      }
    }

    loadMessages(true);
    const timer = setInterval(() => loadMessages(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    const message = content.trim();
    if (!message || !selectedId) {
      return;
    }

    setError('');
    setIsSending(true);
    try {
      const response = await fetch(`/api/admin/support/${encodeURIComponent(selectedId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, replyToMessageId: replyTo?.id || null }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to send your reply.');
      }
      setMessages((currentMessages) => [...currentMessages, result.message]);
      setConversations((currentConversations) => currentConversations.map((conversation) => (
        conversation.id === selectedId
          ? { ...conversation, lastMessage: message, lastSenderType: 'admin' }
          : conversation
      )));
      setContent('');
      setReplyTo(null);
    } catch (sendError) {
      setError(sendError.message || 'Unable to send your reply.');
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

  async function handleSearchUsers(event) {
    event.preventDefault();
    const query = newChatQuery.trim();
    if (!query) {
      setChatUsers([]);
      setNewChatError('Enter a name, username, or email to search.');
      return;
    }

    setIsSearchingUsers(true);
    setNewChatError('');
    try {
      const params = new URLSearchParams({ q: query, page: '1' });
      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to search users.');
      }
      setChatUsers(result.users);
    } catch (searchError) {
      setNewChatError(searchError.message || 'Unable to search users.');
    } finally {
      setIsSearchingUsers(false);
    }
  }

  async function handleStartChat(user) {
    setStartingChatUserId(user.id);
    setNewChatError('');
    try {
      const response = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to start a conversation.');
      }

      setConversations((currentConversations) => [
        result.conversation,
        ...currentConversations.filter((conversation) => conversation.id !== result.conversation.id),
      ]);
      setSelectedId(result.conversation.id);
      setContent('');
      setReplyTo(null);
      setIsNewChatOpen(false);
      setNewChatQuery('');
      setChatUsers([]);
      setError('');
    } catch (startError) {
      setNewChatError(startError.message || 'Unable to start a conversation.');
    } finally {
      setStartingChatUserId('');
    }
  }

  async function handleDeleteConversation() {
    if (!selectedId) {
      return;
    }

    const conversationId = selectedId;
    setError('');
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/support/${encodeURIComponent(conversationId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to delete the conversation.');
      }

      setConversations((currentConversations) => currentConversations.filter(
        (conversation) => conversation.id !== conversationId,
      ));
      setMessages([]);
      setSelectedId('');
      setContent('');
      setReplyTo(null);
      setIsDeleteConfirmOpen(false);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete the conversation.');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteMessage() {
    if (!selectedId || !messageToDelete) {
      return;
    }

    const conversationId = selectedId;
    const deletedMessageId = messageToDelete.id;
    setError('');
    setIsDeletingMessage(true);
    try {
      const response = await fetch(
        `/api/admin/support/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(deletedMessageId)}`,
        { method: 'DELETE' },
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to delete the message.');
      }

      const nextMessages = messages.filter((message) => message.id !== deletedMessageId);
      setMessages(nextMessages);
      setConversations((currentConversations) => currentConversations.map((conversation) => (
        conversation.id === conversationId
          ? {
            ...conversation,
            lastMessage: nextMessages[nextMessages.length - 1]?.content || '',
            lastSenderType: nextMessages[nextMessages.length - 1]?.senderType || '',
          }
          : conversation
      )));
      setReplyTo((currentReply) => currentReply?.id === deletedMessageId ? null : currentReply);
      setMessageToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete the message.');
    } finally {
      setIsDeletingMessage(false);
    }
  }

  return (
    <section className="flex h-full min-h-0 w-full overflow-hidden bg-white">
      <aside className={`${selectedId ? 'hidden lg:flex' : 'flex'} w-full shrink-0 flex-col border-r border-[#e5e7eb] lg:w-[360px]`}>
        <header className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] px-5 py-5">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">Chats</h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              {isLoading ? 'Loading conversations...' : `${conversations.length} support conversations`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewChatError('');
              setIsNewChatOpen(true);
            }}
            aria-label="Start a new chat"
            title="Start a new chat"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25a56a] text-white transition-colors hover:bg-[#168f59]"
          >
            <MessageCircle size={19} aria-hidden="true" />
          </button>
        </header>
        {error && !selectedId && (
          <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-5 text-sm text-[#6b7280]">Loading inbox...</p>
          ) : conversations.length === 0 ? (
            <p className="p-5 text-sm text-[#6b7280]">No support conversations yet. Start a chat with any user.</p>
          ) : conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => {
                setError('');
                setIsDeleteConfirmOpen(false);
                setSelectedId(conversation.id);
              }}
              className={`flex w-full items-center gap-3 border-b border-[#f1f2f4] px-4 py-4 text-left transition-colors hover:bg-[#f7f8fa] ${
                conversation.id === selectedId ? 'bg-[#f3f4f6]' : 'bg-white'
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dbe4ea] text-base font-semibold text-[#334155]">
                {(conversation.userName || conversation.userHandle || '?').slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-[#1f2937]">@{conversation.userHandle}</span>
                  {conversation.unreadCount > 0 && (
                    <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#25a56a] px-2 text-xs font-semibold text-white">
                      <Bell size={13} aria-hidden="true" />
                      +{conversation.unreadCount}
                    </span>
                  )}
                </span>
                <span className="mt-1 block truncate text-sm text-[#6b7280]">
                  {conversation.lastSenderType === 'admin' ? 'You: ' : ''}{conversation.lastMessage || 'No messages yet'}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col bg-[#f7f8fa]`}>
        {selectedConversation ? (
          <>
            <header className="flex shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-white px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedId('');
                  setContent('');
                  setReplyTo(null);
                  setError('');
                  setIsDeleteConfirmOpen(false);
                  setMessageToDelete(null);
                }}
                aria-label="Back to conversations"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#475569] hover:bg-[#f1f5f9]"
              >
                <ArrowLeft size={20} aria-hidden="true" />
              </button>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dbe4ea] font-semibold text-[#334155]">
                {(selectedConversation.userName || selectedConversation.userHandle || '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">@{selectedConversation.userHandle}</h2>
                <p className="truncate text-sm text-[#6b7280]">{selectedConversation.userName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                aria-label="Delete chat"
                title="Delete chat"
                className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={19} aria-hidden="true" />
              </button>
            </header>

            {error && (
              <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
              <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end gap-2">
                {isMessagesLoading ? (
                  <p className="py-8 text-center text-sm text-[#6b7280]">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#6b7280]">No messages in this conversation yet.</p>
                ) : messages.map((message) => (
                  <div key={message.id} className={`group flex items-center gap-2 ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    {message.senderType === 'admin' && (
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
                    <article className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[70%] ${
                      message.senderType === 'admin'
                        ? 'rounded-br-md bg-[#d9fdd3] text-[#1f2937]'
                        : 'rounded-bl-md bg-white text-[#1f2937]'
                    }`}>
                      {message.replyToContent && (
                        <div className="mb-2 border-l-2 border-[#25a56a] bg-black/5 px-2.5 py-1.5 text-xs">
                          <p className="font-semibold text-[#168f59]">
                            {message.replyToSenderType === 'admin' ? 'You' : `@${selectedConversation.userHandle}`}
                          </p>
                          <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words opacity-80">{message.replyToContent}</p>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                      <time className="mt-1 block text-right text-[11px] text-[#6b7280]">{formatMessageTime(message.createdAt)}</time>
                    </article>
                    {message.senderType !== 'admin' && (
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
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 border-t border-[#e5e7eb] bg-white px-3 py-3 sm:px-6">
              <label htmlFor="admin-support-message" className="sr-only">Reply to user</label>
              <div className="mx-auto flex max-w-4xl items-end gap-3">
                <div className="min-w-0 flex-1">
                  {replyTo && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-[#25a56a] bg-[#f1f3f5] px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#168f59]">
                          Replying to {replyTo.senderType === 'admin' ? 'yourself' : `@${selectedConversation.userHandle}`}
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
                    id="admin-support-message"
                    rows="1"
                    maxLength="4000"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    placeholder="Type a message"
                    className="max-h-32 min-h-12 w-full resize-none rounded-2xl bg-[#f1f3f5] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d1d5db]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSending || !content.trim()}
                  aria-label={isSending ? 'Sending message' : 'Send message'}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25a56a] text-white transition-colors hover:bg-[#168f59] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={18} aria-hidden="true" />
                </button>
              </div>
              <p className="mx-auto mt-1 hidden max-w-4xl text-xs text-[#9ca3af] sm:block">Press Enter to send · Shift + Enter for a new line</p>
            </form>

            {isDeleteConfirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-support-title">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                  <h2 id="delete-support-title" className="text-lg font-bold text-[#1f2937]">Delete this chat?</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                    This will permanently delete the conversation with @{selectedConversation.userHandle} and all its messages. This cannot be undone.
                  </p>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      disabled={isDeleting}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-[#f3f4f6] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      disabled={isDeleting}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete chat'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {messageToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-message-title">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                  <h2 id="delete-message-title" className="text-lg font-bold text-[#1f2937]">Delete message for everyone?</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                    This message will be permanently removed from both your chat and the user&apos;s chat.
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
          </>
        ) : (
          <div className="hidden flex-1 items-center justify-center text-center lg:flex">
            <div>
              <h2 className="text-lg font-semibold text-[#374151]">Your support inbox</h2>
              <p className="mt-1 text-sm text-[#6b7280]">Select a conversation to start chatting.</p>
            </div>
          </div>
        )}
      </div>
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="new-support-chat-title">
          <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
              <div>
                <h2 id="new-support-chat-title" className="text-lg font-bold text-[#1f2937]">New chat</h2>
                <p className="mt-1 text-sm text-[#6b7280]">Search for a user to open or start a conversation.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                aria-label="Close new chat"
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="p-5">
              <form onSubmit={handleSearchUsers} className="flex items-center gap-2 rounded-xl border border-[#d1d5db] px-3 focus-within:ring-2 focus-within:ring-[#e5e7eb]">
                <Search size={18} aria-hidden="true" className="shrink-0 text-[#6b7280]" />
                <label htmlFor="support-user-search" className="sr-only">Search users</label>
                <input
                  id="support-user-search"
                  type="search"
                  maxLength={120}
                  value={newChatQuery}
                  onChange={(event) => setNewChatQuery(event.target.value)}
                  placeholder="Name, username, or email"
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={isSearchingUsers}
                  className="rounded-lg bg-[#1f2937] px-3 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                >
                  {isSearchingUsers ? 'Searching...' : 'Search'}
                </button>
              </form>
              {newChatError && (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {newChatError}
                </p>
              )}
              <div className="mt-4 max-h-72 overflow-y-auto">
                {chatUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleStartChat(user)}
                    disabled={Boolean(startingChatUserId)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f7f8fa] disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dbe4ea] font-semibold text-[#334155]">
                      {(user.name || user.handle || '?').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#1f2937]">{user.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#6b7280]">
                        {user.handle ? `@${user.handle}` : 'No username'}{user.email ? ` · ${user.email}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#168f59]">
                      {startingChatUserId === user.id ? 'Opening...' : 'Chat'}
                    </span>
                  </button>
                ))}
                {!isSearchingUsers && newChatQuery.trim() && chatUsers.length === 0 && !newChatError && (
                  <p className="py-6 text-center text-sm text-[#6b7280]">No users found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
