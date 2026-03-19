import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { containsProfanity, cleanProfanity } from '@/lib/profanityFilter';
import { trackChatMessage } from '@/hooks/useAchievementTriggers';

export interface ChatMessage {
  id: string;
  user_id: string | null;
  temp_session_id: string | null;
  display_name: string;
  content: string;
  reply_to_id: string | null;
  created_at: string;
  is_deleted: boolean;
  is_system: boolean;
  user_role: string | null;
  is_vip: boolean;
  reply_to?: ChatMessage | null;
}

const COOLDOWN_AUTH = 3000; // 3 seconds for authenticated users
const COOLDOWN_GUEST = 10000; // 10 seconds for guests

// Generate a random guest name
function generateGuestName(): string {
  const adjectives = ['Swift', 'Quiet', 'Brave', 'Clever', 'Bold', 'Calm', 'Keen', 'Lucky'];
  const nouns = ['Fox', 'Owl', 'Wolf', 'Bear', 'Hawk', 'Lynx', 'Deer', 'Crow'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

// Get or create temp session ID
function getTempSessionId(): string {
  const stored = localStorage.getItem('chat_temp_session');
  if (stored) return stored;
  
  const newId = crypto.randomUUID();
  localStorage.setItem('chat_temp_session', newId);
  return newId;
}

// Get or create guest display name
function getGuestName(): string {
  const stored = localStorage.getItem('chat_guest_name');
  if (stored) return stored;
  
  const newName = generateGuestName();
  localStorage.setItem('chat_guest_name', newName);
  return newName;
}

export const useGlobalChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; displayName: string; role?: string; isVip?: boolean } | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageTime = useRef<number>(0);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        // Fetch profile
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('username, display_name, role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const { data: isVip } = await (supabase as any).rpc('is_vip', { _user_id: user.id });
        
        setCurrentUser({
          id: user.id,
          displayName: profile?.display_name || profile?.username || 'User',
          role: profile?.role,
          isVip: isVip === true
        });
      } else {
        setCurrentUser(null);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('global_chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch reply-to messages
      const replyIds = data?.filter((m: ChatMessage) => m.reply_to_id).map((m: ChatMessage) => m.reply_to_id) || [];
      let replyMap: Record<string, ChatMessage> = {};
      
      if (replyIds.length > 0) {
        const { data: replies } = await (supabase as any)
          .from('global_chat_messages')
          .select('*')
          .in('id', replyIds);
        
        replyMap = (replies || []).reduce((acc: Record<string, ChatMessage>, r: ChatMessage) => {
          acc[r.id] = r;
          return acc;
        }, {});
      }

      const messagesWithReplies = (data || []).map((m: ChatMessage) => ({
        ...m,
        reply_to: m.reply_to_id ? replyMap[m.reply_to_id] : null
      }));

      setMessages(messagesWithReplies);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('global-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_chat_messages'
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // Fetch reply if exists
          let replyTo = null;
          if (newMsg.reply_to_id) {
            const { data } = await (supabase as any)
              .from('global_chat_messages')
              .select('*')
              .eq('id', newMsg.reply_to_id)
              .maybeSingle();
            replyTo = data;
          }
          
          setMessages(prev => [...prev, { ...newMsg, reply_to: replyTo }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'global_chat_messages'
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  // Start cooldown timer
  const startCooldown = useCallback((duration: number) => {
    lastMessageTime.current = Date.now();
    setCooldownRemaining(duration);
    
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
    }
    
    cooldownTimer.current = setInterval(() => {
      const elapsed = Date.now() - lastMessageTime.current;
      const remaining = Math.max(0, duration - elapsed);
      setCooldownRemaining(remaining);
      
      if (remaining <= 0 && cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
      }
    }, 100);
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string, replyToId?: string): Promise<boolean> => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 500) {
      toast.error('Message must be 1-500 characters');
      return false;
    }

    // Check profanity
    if (containsProfanity(trimmed)) {
      toast.error('Message contains inappropriate language');
      return false;
    }

    // Check cooldown
    const cooldown = isAuthenticated ? COOLDOWN_AUTH : COOLDOWN_GUEST;
    const elapsed = Date.now() - lastMessageTime.current;
    if (elapsed < cooldown) {
      const remaining = Math.ceil((cooldown - elapsed) / 1000);
      toast.error(`Please wait ${remaining}s before sending another message`);
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const messageData: any = {
        content: trimmed,
        reply_to_id: replyToId || null,
        is_deleted: false,
        is_system: false
      };

      if (user && currentUser) {
        messageData.user_id = user.id;
        messageData.display_name = currentUser.displayName;
        messageData.user_role = currentUser.role;
        messageData.is_vip = currentUser.isVip;
      } else {
        messageData.temp_session_id = getTempSessionId();
        messageData.display_name = `Guest_${getGuestName()}`;
      }

      const { error } = await (supabase as any)
        .from('global_chat_messages')
        .insert(messageData);

      if (error) throw error;

      // Track chat message for achievements
      trackChatMessage();

      startCooldown(cooldown);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [isAuthenticated, currentUser, startCooldown]);

  // Delete message (moderators only)
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('global_chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message removed');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    cooldownRemaining,
    isAuthenticated,
    currentUser,
    sendMessage,
    deleteMessage,
    fetchMessages,
    cooldownDuration: isAuthenticated ? COOLDOWN_AUTH : COOLDOWN_GUEST
  };
};
