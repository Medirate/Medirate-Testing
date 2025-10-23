"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function PortalModal({ isOpen, onClose, children, className = '' }: PortalModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Create a dedicated portal container to avoid DOM conflicts
    const container = document.createElement('div');
    container.id = 'modal-portal-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      setPortalContainer(null);
    };
  }, [mounted]);

  useEffect(() => {
    if (!isOpen || !mounted || !portalContainer) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, mounted, portalContainer]);

  if (!isOpen || !mounted || !portalContainer) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        ref={modalRef}
        className={`max-w-4xl w-full mx-4 bg-white rounded-lg shadow-lg overflow-hidden relative ${className}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    portalContainer
  );
}
