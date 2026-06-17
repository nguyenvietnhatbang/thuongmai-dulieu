'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g. "max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl"
}

export function Modal({ isOpen, onClose, title, children, maxWidthClass = 'max-w-md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC key listener to close modal
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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 backdrop-blur-xs p-4 py-6 sm:py-10">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Content container */}
      <div className={`bg-card w-full ${maxWidthClass} max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5rem)] rounded-2xl border border-border shadow-2xl relative z-10 animate-fade-in flex flex-col overflow-hidden`}>
        <div className="flex shrink-0 justify-between items-center border-b border-border px-6 py-4">
          <h2 className="min-w-0 truncate text-base font-bold text-foreground">{title}</h2>
          <button 
            onClick={onClose} 
            className="ml-3 shrink-0 p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            title="Đóng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
