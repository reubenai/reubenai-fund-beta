import { useCallback, useEffect, useState } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [isVisible, setIsVisible] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Guard against null/undefined event or key
    if (!event || !event.key) return;
    
    // Show help dialog with ? key
    if (event.key === '?' && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      setIsVisible(true);
      return;
    }

    // Hide help dialog with Escape
    if (event.key === 'Escape') {
      setIsVisible(false);
      return;
    }

    // Check for matches
    for (const shortcut of shortcuts) {
      if (shortcut.disabled || !shortcut.key) continue;

      const matches = 
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.metaKey === !!shortcut.metaKey;

      if (matches) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.metaKey) parts.push('⌘');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  }, []);

  return {
    isVisible,
    setIsVisible,
    formatShortcut
  };
}

// Common keyboard shortcuts for the application
export function useAppKeyboardShortcuts() {
  const [searchVisible, setSearchVisible] = useState(false);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open global search',
      action: () => setSearchVisible(true)
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'Go to deals',
      action: () => window.location.href = '/deals'
    },
    {
      key: 's',
      ctrlKey: true,
      description: 'Go to strategy',
      action: () => window.location.href = '/strategy'
    },
    {
      key: 'i',
      ctrlKey: true,
      description: 'Go to IC',
      action: () => window.location.href = '/ic'
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'Add new deal',
      action: () => {
        // This would trigger the add deal modal
        const event = new CustomEvent('openAddDeal');
        window.dispatchEvent(event);
      }
    },
    {
      key: 'r',
      ctrlKey: true,
      description: 'Refresh current view',
      action: () => window.location.reload()
    }
  ];

  const { isVisible, setIsVisible, formatShortcut } = useKeyboardShortcuts(shortcuts);

  return {
    shortcuts,
    searchVisible,
    setSearchVisible,
    helpVisible: isVisible,
    setHelpVisible: setIsVisible,
    formatShortcut
  };
}