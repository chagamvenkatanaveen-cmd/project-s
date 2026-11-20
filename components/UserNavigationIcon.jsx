'use client';

import { useEffect, useState } from 'react';

export default function UserNavigationIcon({ icon: Icon, href }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (href !== '/support') {
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    async function loadUnreadCount() {
      try {
        const response = await fetch('/api/support/unread-count', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (response.status === 401) {
          return;
        }

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load support notifications.');
        }
        if (!Number.isInteger(result.count) || result.count < 0) {
          throw new Error('Support notification count was invalid.');
        }
        if (active) {
          setUnreadCount(result.count);
        }
      } catch (error) {
        if (active && !controller.signal.aborted) {
          console.error('Loading support notification badge failed:', error);
        }
      }
    }

    loadUnreadCount();
    const timer = window.setInterval(loadUnreadCount, 5000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [href]);

  return (
    <span className="relative inline-flex">
      <Icon size={20} aria-hidden="true" />
      {href === '/support' && unreadCount > 0 && (
        <span
          aria-label={`${unreadCount} unread support messages`}
          className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </span>
  );
}
