"use client";

import { useEffect } from 'react';

const DebugMode = () => {
  useEffect(() => {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // If not in development mode, don't enable debug mode
    if (!isDevelopment) {
      return;
    }

    // Re-enable right-click for debugging
    const enableRightClick = (e: MouseEvent) => {
      e.stopPropagation();
      return true;
    };

    // Re-enable text selection
    const enableSelection = (e: Event) => {
      e.stopPropagation();
      return true;
    };

    // Re-enable keyboard shortcuts
    const enableKeyboard = (e: KeyboardEvent) => {
      e.stopPropagation();
      return true;
    };

    // Add event listeners with capture=true to override the global ones
    document.addEventListener('contextmenu', enableRightClick, { capture: true });
    document.addEventListener('selectstart', enableSelection, { capture: true });
    document.addEventListener('keydown', enableKeyboard, { capture: true });

    // Also remove the no-right-click class temporarily
    document.body.classList.remove('no-right-click');
    document.body.classList.add('debug-mode');

    console.log('🔧 Debug Mode enabled - Right-click, text selection, and keyboard shortcuts are now available');

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', enableRightClick, { capture: true });
      document.removeEventListener('selectstart', enableSelection, { capture: true });
      document.removeEventListener('keydown', enableKeyboard, { capture: true });
      
      // Don't restore no-right-click class - keep debug mode enabled
      // document.body.classList.add('no-right-click');
      // document.body.classList.remove('debug-mode');
    };
  }, []);

  // Only show the debug indicator in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-100 border-2 border-green-400 rounded-lg p-2 text-xs text-green-800 font-mono">
      🐛 Dev Mode: Right-click enabled
    </div>
  );
};

export default DebugMode;
