import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OSToastType = 'info' | 'success' | 'warning' | 'error';

export interface OSToastData {
  id: string;
  title: string;
  message?: string;
  type: OSToastType;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

const toastQueue: OSToastData[] = [];
const listeners: Set<() => void> = new Set();

const notify = () => listeners.forEach(fn => fn());

export const osToast = {
  show: (toast: Omit<OSToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    toastQueue.push({ ...toast, id });
    notify();
    return id;
  },
  success: (title: string, message?: string) => osToast.show({ title, message, type: 'success' }),
  error: (title: string, message?: string) => osToast.show({ title, message, type: 'error' }),
  warning: (title: string, message?: string) => osToast.show({ title, message, type: 'warning' }),
  info: (title: string, message?: string) => osToast.show({ title, message, type: 'info' }),
  dismiss: (id: string) => {
    const idx = toastQueue.findIndex(t => t.id === id);
    if (idx >= 0) toastQueue.splice(idx, 1);
    notify();
  },
};

const getIcon = (type: OSToastType) => {
  switch (type) {
    case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
    default: return <Info className="w-5 h-5 text-primary" />;
  }
};

const getAccent = (type: OSToastType) => {
  switch (type) {
    case 'success': return 'border-l-emerald-500';
    case 'warning': return 'border-l-amber-500';
    case 'error': return 'border-l-red-500';
    default: return 'border-l-primary';
  }
};

const SingleToast = ({ toast, onDismiss }: { toast: OSToastData; onDismiss: (id: string) => void }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const dur = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, dur);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={cn(
        "relative w-80 rounded-lg border border-border/60 border-l-[3px] shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300",
        getAccent(toast.type),
        exiting ? "opacity-0 translate-x-8 scale-95" : "opacity-100 translate-x-0 scale-100",
      )}
      style={{
        background: 'hsl(var(--card) / 0.92)',
      }}
    >
      <div className="flex gap-3 p-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight">{toast.title}</div>
          {toast.message && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); handleDismiss(); }}
              className="text-xs font-medium text-primary hover:underline mt-1.5"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-[2px] bg-muted/20">
        <div
          className={cn(
            "h-full transition-none",
            toast.type === 'success' ? 'bg-emerald-500/60' :
            toast.type === 'warning' ? 'bg-amber-500/60' :
            toast.type === 'error' ? 'bg-red-500/60' : 'bg-primary/60'
          )}
          style={{
            animation: `toast-progress ${toast.duration ?? 4000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};

export const OSToastContainer = () => {
  const [toasts, setToasts] = useState<OSToastData[]>([]);

  useEffect(() => {
    const update = () => setToasts([...toastQueue]);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    osToast.dismiss(id);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[99999] flex flex-col gap-2 pointer-events-auto">
      {toasts.slice(0, 5).map(t => (
        <SingleToast key={t.id} toast={t} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};
