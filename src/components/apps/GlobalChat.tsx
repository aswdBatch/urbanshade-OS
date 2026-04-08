import React, { useState, useRef, useEffect } from 'react';
import { useGlobalChat, ChatMessage } from '@/hooks/useGlobalChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { 
  Send, 
  Reply, 
  X, 
  Trash2, 
  Crown, 
  Shield, 
  Star,
  MessageCircle,
  Users,
  Loader2,
  Globe,
  UserCheck,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type ChatMode = 'public' | 'friends';

const GlobalChat: React.FC = () => {
  const {
    messages,
    isLoading,
    cooldownRemaining,
    isAuthenticated,
    currentUser,
    sendMessage,
    deleteMessage,
    cooldownDuration
  } = useGlobalChat();

  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('public');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const success = await sendMessage(inputValue, replyingTo?.id);
    if (success) {
      setInputValue('');
      setReplyingTo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cooldownPercent = cooldownRemaining > 0 
    ? (cooldownRemaining / cooldownDuration) * 100 
    : 0;

  const canModerate = currentUser?.role === 'admin' || currentUser?.role === 'creator';

  const getRoleBadge = (msg: ChatMessage) => {
    if (msg.user_role === 'creator') {
      return <Badge className="ml-1 bg-amber-500/20 text-amber-400 text-[10px] px-1"><Crown className="w-2.5 h-2.5 mr-0.5" />Creator</Badge>;
    }
    if (msg.user_role === 'admin') {
      return <Badge className="ml-1 bg-red-500/20 text-red-400 text-[10px] px-1"><Shield className="w-2.5 h-2.5 mr-0.5" />Admin</Badge>;
    }
    if (msg.is_vip) {
      return <Badge className="ml-1 bg-purple-500/20 text-purple-400 text-[10px] px-1"><Star className="w-2.5 h-2.5 mr-0.5" />VIP</Badge>;
    }
    if (!msg.user_id) {
      return <Badge variant="outline" className="ml-1 text-[10px] px-1 opacity-60">Guest</Badge>;
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* EOL Banner */}
      <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/30 text-center">
        <p className="text-[11px] font-medium text-red-400">⚰️ UrbanShade OS has reached End of Life. Chat remains open but unmoderated.</p>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="font-semibold">Global Chat</span>
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant={chatMode === 'public' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setChatMode('public')}
            >
              <Globe className="w-3 h-3 mr-1" />
              Public
            </Button>
            <Button
              variant={chatMode === 'friends' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setChatMode('friends')}
              disabled={!isAuthenticated}
              title={!isAuthenticated ? "Sign in to use Friends Only mode" : ""}
            >
              <UserCheck className="w-3 h-3 mr-1" />
              Friends
            </Button>
          </div>
        </div>
        {/* User Profile Display */}
        <div className="flex items-center gap-2">
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  {getInitials(currentUser.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{currentUser.displayName}</span>
                <span className="text-[10px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Online
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-muted">
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Guest</span>
                <span className="text-[10px] text-yellow-400">10s cooldown</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Friends Only Mode Notice */}
      {chatMode === 'friends' && (
        <div className="px-3 py-2 bg-muted/50 border-b border-border/50 text-xs text-muted-foreground flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          <span>Friends Only mode - Only messages from friends are shown (coming soon)</span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-2 opacity-30" />
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "group relative rounded-lg p-2 transition-colors",
                  msg.is_deleted 
                    ? "bg-muted/30 italic text-muted-foreground" 
                    : "hover:bg-muted/50",
                  msg.is_system && "bg-blue-500/10 border-l-2 border-blue-500"
                )}
              >
                {/* Reply reference */}
                {msg.reply_to && !msg.reply_to.is_deleted && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 pl-2 border-l-2 border-muted-foreground/30">
                    <Reply className="w-3 h-3" />
                    <span className="font-medium">{msg.reply_to.display_name}:</span>
                    <span className="truncate max-w-[200px]">{msg.reply_to.content}</span>
                  </div>
                )}

                {/* Message header */}
                <div className="flex items-center gap-2 text-sm">
                  <UserAvatar
                    userId={msg.user_id || undefined}
                    username={msg.display_name}
                    role={msg.user_role || undefined}
                    isVip={msg.is_vip || false}
                    size="xs"
                    clickable={!!msg.user_id}
                  />
                  <span 
                    className={cn(
                      "font-semibold cursor-pointer hover:underline",
                      msg.user_role === 'creator' && "text-amber-400",
                      msg.user_role === 'admin' && "text-red-400",
                      msg.is_vip && "text-purple-400",
                      !msg.user_id && "text-muted-foreground"
                    )}
                  >
                    {msg.display_name}
                  </span>
                  {getRoleBadge(msg)}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Message content */}
                <p className="text-sm mt-0.5 break-words">
                  {msg.is_deleted ? '[Message removed by moderator]' : msg.content}
                </p>

                {/* Actions */}
                {!msg.is_deleted && (
                  <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setReplyingTo(msg);
                        inputRef.current?.focus();
                      }}
                    >
                      <Reply className="w-3 h-3" />
                    </Button>
                    {canModerate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deleteMessage(msg.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-t border-border/50">
          <Reply className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Replying to <span className="font-medium">{replyingTo.display_name}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-auto"
            onClick={() => setReplyingTo(null)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border/50">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAuthenticated ? "Type a message..." : "Type a message (Guest mode)..."}
              maxLength={500}
              className="pr-16"
              disabled={cooldownRemaining > 0}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {inputValue.length}/500
            </span>
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || cooldownRemaining > 0}
            className="relative overflow-hidden"
          >
            {cooldownRemaining > 0 ? (
              <>
                <div 
                  className="absolute inset-0 bg-primary/30 transition-all"
                  style={{ width: `${cooldownPercent}%` }}
                />
                <span className="relative z-10">{Math.ceil(cooldownRemaining / 1000)}s</span>
              </>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isAuthenticated 
            ? "3 second cooldown between messages" 
            : "10 second cooldown for guests • Sign in to reduce cooldown"}
        </p>
      </div>
    </div>
  );
};

export default GlobalChat;
