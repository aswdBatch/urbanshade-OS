import { useState, useEffect } from "react";
import { X, Plus, Monitor } from "lucide-react";
import { WindowData } from "@/types/window";

interface TaskViewProps {
  open: boolean;
  onClose: () => void;
  windows: WindowData[];
  onFocusWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
  desktops?: { id: string; name: string }[];
  activeDesktopId?: string;
  onSwitchDesktop?: (id: string) => void;
  onCreateDesktop?: () => void;
}

export const TaskView = ({ 
  open, 
  onClose, 
  windows, 
  onFocusWindow, 
  onCloseWindow,
  desktops = [],
  activeDesktopId,
  onSwitchDesktop,
  onCreateDesktop
}: TaskViewProps) => {
  const [hoveredWindow, setHoveredWindow] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, windows.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && windows[selectedIndex]) {
        e.preventDefault();
        onFocusWindow(windows[selectedIndex].id);
        onClose();
      } else if (e.key === 'Delete' && windows[selectedIndex]) {
        e.preventDefault();
        onCloseWindow(windows[selectedIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, windows, selectedIndex, onFocusWindow, onCloseWindow]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />
      
      {/* Virtual Desktops Row */}
      {desktops.length > 0 && (
        <div className="relative z-10 flex items-center justify-center gap-3 py-6">
          {desktops.map((desktop) => (
            <button
              key={desktop.id}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchDesktop?.(desktop.id);
                onClose();
              }}
              className={`px-6 py-3 rounded-xl glass-panel transition-all ${
                desktop.id === activeDesktopId 
                  ? 'ring-2 ring-primary bg-primary/20' 
                  : 'hover:bg-white/10'
              }`}
            >
              <Monitor className="w-4 h-4 mb-1 mx-auto" />
              <div className="text-sm font-medium">{desktop.name}</div>
            </button>
          ))}
          {onCreateDesktop && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateDesktop();
              }}
              className="p-3 rounded-xl glass-panel hover:bg-white/10 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Windows Grid */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-8">
        {windows.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <div className="text-xl">No open windows</div>
            <div className="text-sm mt-2">Open an app to see it here</div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 max-w-[90vw]">
            {windows.map((win, index) => (
              <div
                key={win.id}
                className={`relative group cursor-pointer animate-scale-in`}
                style={{ animationDelay: `${index * 50}ms` }}
                onMouseEnter={() => setHoveredWindow(win.id)}
                onMouseLeave={() => setHoveredWindow(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusWindow(win.id);
                  onClose();
                }}
              >
                {/* Window Preview Card */}
                <div className={`w-64 h-44 rounded-xl glass-panel overflow-hidden transition-all duration-200 ${
                  index === selectedIndex || hoveredWindow === win.id
                    ? 'ring-2 ring-primary scale-105 shadow-xl shadow-primary/20'
                    : 'hover:ring-1 hover:ring-white/20'
                } ${win.minimized ? 'opacity-60' : ''}`}>
                  {/* Window content preview (simplified) */}
                  <div className="h-8 bg-white/5 border-b border-white/10 flex items-center px-3 gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    <span className="text-xs text-muted-foreground truncate ml-2">{win.app.name}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-primary opacity-50 [&>svg]:w-12 [&>svg]:h-12">
                      {win.app.icon}
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseWindow(win.id);
                  }}
                  className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center transition-opacity ${
                    hoveredWindow === win.id || index === selectedIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* App name */}
                <div className="text-center mt-3">
                  <div className="text-sm font-medium truncate">{win.app.name}</div>
                  {win.minimized && (
                    <div className="text-xs text-muted-foreground">Minimized</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-6">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10">←→</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10">Enter</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10">Del</kbd> Close Window
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10">Esc</kbd> Exit
          </span>
        </div>
      </div>
    </div>
  );
};
