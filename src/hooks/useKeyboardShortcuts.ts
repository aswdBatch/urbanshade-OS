import { useEffect, useCallback, useState } from 'react';
import { App, WindowData } from '@/types/window';

interface UseKeyboardShortcutsProps {
  windows: WindowData[];
  onFocusWindow: (id: string) => void;
  onMinimizeWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
  onToggleStartMenu: () => void;
  openWindow: (app: App) => void;
  allApps: App[];
  onToggleSearch?: () => void;
  onToggleTaskView?: () => void;
  onLock?: () => void;
}

/**
 * Keyboard shortcuts for UrbanShade OS
 * 
 * All shortcuts use SHIFT as the modifier to avoid conflicts with real OS shortcuts.
 * This ensures users can use UrbanShade shortcuts without triggering system actions.
 * 
 * Shortcuts:
 * - Shift + / : Toggle global search
 * - Shift + Tab : Alt-tab style window switcher
 * - Shift + Escape : Open task manager
 * - Shift + D : Minimize all (show desktop)
 * - Shift + E : Open file explorer
 * - Shift + T : Open terminal
 * - Shift + I : Open settings
 * - Shift + L : Lock screen
 * - Shift + Q : Close focused window
 * - Shift + M : Minimize focused window
 * - Shift + W : Task view
 * - F11 : Toggle fullscreen (browser native)
 */
export const useKeyboardShortcuts = ({
  windows,
  onFocusWindow,
  onMinimizeWindow,
  onCloseWindow,
  onToggleStartMenu,
  openWindow,
  allApps,
  onToggleSearch,
  onToggleTaskView,
  onLock
}: UseKeyboardShortcutsProps) => {
  const [altTabActive, setAltTabActive] = useState(false);
  const [altTabIndex, setAltTabIndex] = useState(0);

  // Get non-minimized windows sorted by z-index
  const sortedWindows = [...windows]
    .filter(w => !w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // All shortcuts use Shift modifier (no Ctrl, no Meta, no Alt)
    // This avoids conflicts with real OS shortcuts
    if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
      // Exception: F11 for fullscreen (no modifiers needed)
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
      return;
    }

    switch (e.key.toLowerCase()) {
      // Shift + / - Toggle global search
      case '/':
        e.preventDefault();
        onToggleSearch?.();
        break;

      // Shift + Tab - Window switcher
      case 'tab':
        e.preventDefault();
        if (sortedWindows.length > 1) {
          setAltTabActive(true);
          setAltTabIndex(prev => (prev + 1) % sortedWindows.length);
        }
        break;

      // Shift + Escape - Task manager
      case 'escape':
        e.preventDefault();
        const taskManager = allApps.find(a => a.id === 'task-manager');
        if (taskManager) openWindow(taskManager);
        break;

      // Shift + D - Show desktop (minimize all)
      case 'd':
        e.preventDefault();
        windows.forEach(w => {
          if (!w.minimized) onMinimizeWindow(w.id);
        });
        break;

      // Shift + E - File explorer
      case 'e':
        e.preventDefault();
        const explorer = allApps.find(a => a.id === 'explorer');
        if (explorer) openWindow(explorer);
        break;

      // Shift + T - Terminal
      case 't':
        e.preventDefault();
        const terminal = allApps.find(a => a.id === 'terminal');
        if (terminal) openWindow(terminal);
        break;

      // Shift + I - Settings
      case 'i':
        e.preventDefault();
        const settings = allApps.find(a => a.id === 'settings');
        if (settings) openWindow(settings);
        break;

      // Shift + L - Lock screen
      case 'l':
        e.preventDefault();
        onLock?.();
        break;

      // Shift + Q - Close focused window
      case 'q':
        e.preventDefault();
        if (sortedWindows.length > 0) {
          onCloseWindow(sortedWindows[0].id);
        }
        break;

      // Shift + M - Minimize focused window
      case 'm':
        e.preventDefault();
        if (sortedWindows.length > 0) {
          onMinimizeWindow(sortedWindows[0].id);
        }
        break;

      // Shift + W - Task view
      case 'w':
        e.preventDefault();
        onToggleTaskView?.();
        break;

      // Shift + S - Toggle start menu (alternative)
      case 's':
        e.preventDefault();
        onToggleStartMenu();
        break;
    }
  }, [sortedWindows, windows, onToggleStartMenu, onMinimizeWindow, onCloseWindow, openWindow, allApps, onToggleSearch, onToggleTaskView, onLock]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Shift released - confirm window switcher selection
    if (altTabActive && e.key === 'Shift') {
      setAltTabActive(false);
      if (sortedWindows[altTabIndex]) {
        onFocusWindow(sortedWindows[altTabIndex].id);
      }
      setAltTabIndex(0);
    }
  }, [altTabActive, altTabIndex, sortedWindows, onFocusWindow]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    altTabActive,
    altTabIndex,
    sortedWindows
  };
};