'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string; // e.g. "max-w-xl", "max-w-2xl"
  type?: 'overlay' | 'push';
}

export function Drawer({ isOpen, onClose, title, subtitle, children, footer, maxWidthClass = 'max-w-xl', type = 'overlay' }: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [pushExpanded, setPushExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || type !== 'push') {
      setPushExpanded(false);
      return;
    }

    const timerId = window.setTimeout(() => {
      setPushExpanded(true);
    }, 30);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isOpen, type]);

  // ESC key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (type === 'push') {
    const drawerWidth = maxWidthClass.includes('max-w-4xl')
      ? 'min(72rem, 55vw)'
      : maxWidthClass.includes('max-w-3xl')
        ? 'min(64rem, 50vw)'
        : maxWidthClass.includes('max-w-2xl')
          ? 'min(48rem, 45vw)'
          : maxWidthClass.includes('max-w-xl')
            ? '36rem'
            : '42rem';

    return (
      <div
        className={`relative h-full ${maxWidthClass} border-l border-border bg-card flex flex-col justify-between shrink-0 shadow-lg overflow-hidden`}
        style={{
          width: pushExpanded ? drawerWidth : '0rem',
          maxWidth: pushExpanded ? drawerWidth : '0rem',
          opacity: pushExpanded ? 1 : 0,
          transform: pushExpanded ? 'translateX(0)' : 'translateX(18px)',
          transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1), max-width 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out, transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'width, max-width, transform, opacity',
        }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              {subtitle && <div className="mt-1">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
              title="Đóng"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-border bg-slate-50/50 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    );
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/35 backdrop-blur-xs"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full ${maxWidthClass} bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-slide-in-right`}>
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              {subtitle && <div className="mt-1">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
              title="Đóng"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-border bg-slate-50/50 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
