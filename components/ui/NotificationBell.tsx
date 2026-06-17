'use client';

import { useEffect, useState, useRef } from 'react';
import { Notification } from '@/features/notifications/services/notification.service';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Click outside handler to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id }),
      });
      const json = await res.json();
      if (json.success) {
        // Optimistically update status to read
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, status: 'read' as const, readAt: new Date().toISOString() } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, status: 'read' as const, readAt: new Date().toISOString() }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering mark as read
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', id }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const getEntityIcon = (type: string | null) => {
    switch (type) {
      case 'project':
        return (
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'receivable':
        return (
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
            </svg>
          </div>
        );
      case 'customer':
      default:
        return (
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 cursor-pointer"
        aria-label="Thông báo"
      >
        <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-primary-foreground ring-2 ring-card">
            {unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-3 shadow-2xl z-50 animate-fade-in flex flex-col max-h-[420px]">
          <div className="flex justify-between items-center pb-2 border-b border-border mb-2 px-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {unreadCount} mới
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[10px] font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[120px] max-h-[300px] scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                <svg className="w-8 h-8 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = n.status === 'unread';
                return (
                  <div
                    key={n.id}
                    onClick={() => isUnread && handleMarkAsRead(n.id)}
                    className={`p-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer relative group ${
                      isUnread ? 'bg-primary/3 border border-primary/10' : 'hover:bg-slate-50/50 border border-transparent'
                    }`}
                  >
                    {getEntityIcon(n.entityType)}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`text-xs text-foreground leading-tight ${isUnread ? 'font-bold' : 'font-medium text-slate-700'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[10px] text-muted-foreground mt-1 leading-normal break-words line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[9px] text-muted-foreground mt-1.5 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString('vi-VN')} - {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      {isUnread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                      <button
                        onClick={(e) => handleArchive(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-all cursor-pointer"
                        title="Lưu trữ"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
