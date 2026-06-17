'use client';

import React, { useEffect } from 'react';

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
    return (
      <div className="relative h-full w-[450px] md:w-[500px] border-l border-border bg-card flex flex-col justify-between shrink-0 shadow-lg animate-slide-in-right overflow-hidden">
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-30 bg-black/35 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className={`fixed inset-y-0 right-0 z-40 w-full ${maxWidthClass} bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-fade-in`}>
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
    </>
  );
}
