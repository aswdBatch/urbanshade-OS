import { useEffect } from "react";

interface DefDevShortcuts {
  onToggleFloating?: () => void;
  onCaptureSnapshot?: () => void;
  onToggleMockApi?: () => void;
  onSwitchTab?: (tab: string) => void;
  onClearLogs?: () => void;
  onFocusSearch?: () => void;
  onFocusTerminal?: () => void;
}

const TAB_MAP: Record<string, string> = {
  '1': 'console',
  '2': 'terminal',
  '3': 'actions',
  '4': 'bugchecks',
  '5': 'performance',
  '6': 'network',
  '7': 'storage',
  '8': 'events',
  '9': 'admin',
};

export const useDefDevKeyboardShortcuts = (callbacks: DefDevShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Shift shortcuts
      if (ctrl && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            callbacks.onToggleFloating?.();
            break;
          case 's':
            e.preventDefault();
            callbacks.onCaptureSnapshot?.();
            break;
          case 'm':
            e.preventDefault();
            callbacks.onToggleMockApi?.();
            break;
          case 't':
            e.preventDefault();
            callbacks.onFocusTerminal?.();
            callbacks.onSwitchTab?.('terminal');
            break;
        }
        // Ctrl+Shift+Number for tabs
        if (TAB_MAP[e.key]) {
          e.preventDefault();
          callbacks.onSwitchTab?.(TAB_MAP[e.key]);
        }
        return;
      }

      // Ctrl-only shortcuts
      if (ctrl && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'l':
            e.preventDefault();
            callbacks.onClearLogs?.();
            break;
          case 'k':
            e.preventDefault();
            callbacks.onFocusSearch?.();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
};

export default useDefDevKeyboardShortcuts;
