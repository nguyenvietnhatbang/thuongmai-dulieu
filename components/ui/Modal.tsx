'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g. "max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl"
}

export function Modal({ isOpen, onClose, title, children, maxWidthClass = 'max-w-md' }: ModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Content container */}
      <div className={`bg-card w-full ${maxWidthClass} rounded-2xl border border-border p-6 shadow-2xl space-y-4 relative z-10 animate-fade-in`}>
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            title="Đóng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}
