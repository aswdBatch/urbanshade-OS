import { useState, useEffect, useMemo } from "react";
import { Search, X, AppWindow, FileText, Settings as SettingsIcon, Calculator, Terminal, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { App } from "@/types/window";
import { evaluate } from "mathjs";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  apps: App[];
  onOpenApp: (app: App) => void;
}

interface SearchResult {
  type: 'app' | 'setting' | 'file' | 'command';
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const GlobalSearch = ({ open, onClose, apps, onOpenApp }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Quick math evaluation using safe mathjs library
  const mathResult = useMemo(() => {
    if (!query) return null;
    try {
      // Only allow simple math expressions (digits, operators, parentheses, decimals)
      if (/^[\d\s+\-*/().]+$/.test(query)) {
        const result = evaluate(query);
        if (typeof result === 'number' && isFinite(result)) {
          return result;
        }
      }
    } catch {
      return null;
    }
    return null;
  }, [query]);

  // Search results
  const results = useMemo((): SearchResult[] => {
    const items: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    if (!query) {
      // Show recent/popular apps when no query
      apps.slice(0, 6).forEach(app => {
        items.push({
          type: 'app',
          id: app.id,
          name: app.name,
          description: 'Application',
          icon: app.icon,
          action: () => onOpenApp(app)
        });
      });
      return items;
    }

    // Math result
    if (mathResult !== null) {
      items.push({
        type: 'command',
        id: 'math-result',
        name: `= ${mathResult}`,
        description: `Result of ${query}`,
        icon: <Calculator className="w-5 h-5" />,
        action: () => {
          navigator.clipboard.writeText(String(mathResult));
        }
      });
    }

    // Filter apps
    apps.filter(app => 
      app.name.toLowerCase().includes(lowerQuery)
    ).forEach(app => {
      items.push({
        type: 'app',
        id: app.id,
        name: app.name,
        description: 'Application',
        icon: app.icon,
        action: () => onOpenApp(app)
      });
    });

    // Settings shortcuts
    const settingItems = [
      { name: 'Display Settings', description: 'Screen resolution, theme', keyword: 'display screen resolution theme' },
      { name: 'Network Settings', description: 'WiFi, VPN, Proxy', keyword: 'network wifi vpn internet' },
      { name: 'Sound Settings', description: 'Volume, audio', keyword: 'sound volume audio speaker' },
      { name: 'Privacy Settings', description: 'Location, security', keyword: 'privacy security location' },
      { name: 'About System', description: 'System information', keyword: 'about system version info' },
    ];

    settingItems.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) || 
      s.keyword.toLowerCase().includes(lowerQuery)
    ).forEach(setting => {
      const settingsApp = apps.find(a => a.id === 'settings');
      if (settingsApp) {
        items.push({
          type: 'setting',
          id: setting.name,
          name: setting.name,
          description: setting.description,
          icon: <SettingsIcon className="w-5 h-5" />,
          action: () => onOpenApp(settingsApp)
        });
      }
    });

    return items.slice(0, 8);
  }, [query, apps, onOpenApp, mathResult]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        results[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, results, selectedIndex]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      
      {/* Search Box */}
      <div 
        className="relative w-[600px] glass-panel rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <Search className="w-6 h-6 text-primary" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search apps, settings, or type a calculation..."
            className="flex-1 bg-transparent border-0 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-auto p-2">
          {results.length === 0 && query && (
            <div className="text-center py-8 text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
          
          {results.map((result, index) => (
            <button
              key={result.id}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-left ${
                index === selectedIndex 
                  ? 'bg-primary/20 text-primary-foreground' 
                  : 'hover:bg-white/5'
              }`}
              onClick={() => {
                result.action();
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                index === selectedIndex ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-primary'
              }`}>
                <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
                  {result.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{result.name}</div>
                {result.description && (
                  <div className="text-sm text-muted-foreground truncate">{result.description}</div>
                )}
              </div>
              <div className="text-xs text-muted-foreground capitalize px-2 py-1 rounded bg-white/5">
                {result.type}
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-white/10 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">Enter</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">Esc</kbd> Close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>+ S to open search</span>
          </div>
        </div>
      </div>
    </div>
  );
};
