import { useState, useRef, useEffect } from "react";
import { 
  Bell, Check, Trash2, X, AlertTriangle, Info, CheckCircle, XCircle,
  ChevronDown, ChevronRight, BellOff, Moon
} from "lucide-react";
import { useNotifications, SystemNotification, NotificationType, GroupedNotifications } from "@/hooks/useNotifications";
import { useDoNotDisturb } from "@/hooks/useDoNotDisturb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement>;
}

export const NotificationCenter = ({ open, onClose, anchorRef }: NotificationCenterProps) => {
  const { 
    filteredNotifications,
    groupedByTime, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    dismissNotification,
    clearAll,
    executeAction
  } = useNotifications();
  
  const { 
    isDndEnabled, 
    isManualDnd, 
    isScheduledDnd, 
    toggleDnd, 
    getTimeUntilEnd 
  } = useDoNotDisturb();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Just now", "Earlier today"]));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose, anchorRef]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const getIcon = (type: NotificationType) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case "success": return <CheckCircle className={`${iconClass} text-emerald-400`} />;
      case "warning": return <AlertTriangle className={`${iconClass} text-amber-400`} />;
      case "error": return <XCircle className={`${iconClass} text-red-400`} />;
      default: return <Info className={`${iconClass} text-primary`} />;
    }
  };

  const getTypeBorder = (type: NotificationType) => {
    switch (type) {
      case "success": return "border-l-emerald-500";
      case "warning": return "border-l-amber-500";
      case "error": return "border-l-red-500";
      default: return "border-l-primary";
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderNotification = (notification: SystemNotification) => (
    <div
      key={notification.id}
      onClick={() => markAsRead(notification.id)}
      className={`
        relative p-3 rounded-lg transition-all cursor-pointer group 
        border-l-2 ${getTypeBorder(notification.type)}
        ${notification.read ? "opacity-50 hover:opacity-70" : "bg-white/[0.02] hover:bg-white/[0.04]"}
      `}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center">
          {getIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground leading-tight">
              {notification.title}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {formatTime(notification.time)}
              </span>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  notification.persistent ? dismissNotification(notification.id) : deleteNotification(notification.id); 
                }}
                className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          {/* App tag + Actions */}
          <div className="flex items-center justify-between mt-2">
            {notification.app && (
              <span className="text-[10px] text-muted-foreground/60 bg-white/5 px-1.5 py-0.5 rounded font-medium">
                {notification.app}
              </span>
            )}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-1.5 ml-auto">
                {notification.actions.map((action, i) => (
                  <Button
                    key={i}
                    variant={action.primary ? "default" : "ghost"}
                    size="sm"
                    className={`h-6 text-[10px] px-2 ${action.primary ? 'bg-primary/20 hover:bg-primary/30 text-primary border-0' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      executeAction(notification.id, action.action);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-3 right-12 w-2 h-2 bg-primary rounded-full animate-pulse" />
      )}
    </div>
  );

  const renderGroupedNotifications = (groups: GroupedNotifications) => {
    const nonEmptyGroups = Object.entries(groups).filter(([_, notifs]) => notifs.length > 0);
    
    if (nonEmptyGroups.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
            <Bell className="w-6 h-6 text-primary/30" />
          </div>
          <p className="text-sm font-medium text-foreground/80">All clear</p>
          <p className="text-xs text-muted-foreground/60 mt-1">No notifications</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {nonEmptyGroups.map(([group, notifs]) => (
          <div key={group}>
            <button
              onClick={() => toggleGroup(group)}
              className="flex items-center gap-2 w-full px-2 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
            >
              {expandedGroups.has(group) ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span className="uppercase tracking-wider">{group}</span>
              <span className="ml-auto text-[10px] bg-white/5 px-2 py-0.5 rounded-full tabular-nums">
                {notifs.length}
              </span>
            </button>
            {expandedGroups.has(group) && (
              <div className="space-y-1 mt-1 mb-3">
                {notifs.map(renderNotification)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-2 top-[52px] w-[380px] max-h-[calc(100vh-70px)] rounded-xl overflow-hidden z-[99999] shadow-2xl animate-notif-slide-in flex flex-col"
      style={{
        background: 'hsl(var(--glass-strong))',
        backdropFilter: 'blur(20px)',
        border: '1px solid hsl(var(--border))',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-[11px] text-primary">{unreadCount} new</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {filteredNotifications.length > 0 && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/10" 
                onClick={markAllAsRead} 
                title="Mark all read"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/10" 
                onClick={clearAll} 
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* DND Banner */}
      {isDndEnabled && (
        <div className="border-b border-border/30 px-4 py-2.5 bg-primary/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Do Not Disturb</span>
            {isScheduledDnd && !isManualDnd && (
              <span className="text-[10px] text-muted-foreground bg-white/10 px-1.5 py-0.5 rounded">Scheduled</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground tabular-nums">{getTimeUntilEnd()}</span>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 hover:bg-white/10" onClick={toggleDnd}>
              {isManualDnd ? "Off" : "Override"}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 px-2 py-2">
        {renderGroupedNotifications(groupedByTime)}
      </ScrollArea>

      {/* Footer */}
      {!isDndEnabled && (
        <div className="border-t border-border/30 p-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2.5 text-muted-foreground h-9 text-xs hover:bg-white/5"
            onClick={toggleDnd}
          >
            <BellOff className="w-4 h-4" />
            Enable Do Not Disturb
          </Button>
        </div>
      )}
    </div>
  );
};
