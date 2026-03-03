import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BanInfo {
  isBanned: boolean;
  isFakeBan: boolean;
  isTempBan: boolean;
  reason: string | null;
  expiresAt: Date | null;
  actionType: string | null;
}

export interface PendingWarning {
  id: string;
  reason: string | null;
}

export const useBanCheck = () => {
  const [banInfo, setBanInfo] = useState<BanInfo>({
    isBanned: false,
    isFakeBan: false,
    isTempBan: false,
    reason: null,
    expiresAt: null,
    actionType: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [vipReason, setVipReason] = useState<string | null>(null);
  const [showVipWelcome, setShowVipWelcome] = useState(false);
  const [tempBanDismissed, setTempBanDismissed] = useState(false);
  const [pendingWarning, setPendingWarning] = useState<PendingWarning | null>(null);

  const checkBanStatus = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // Handle auth errors gracefully (network issues, etc.)
      if (authError) {
        console.warn('Auth check failed (possibly offline):', authError.message);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        setBanInfo({ isBanned: false, isFakeBan: false, isTempBan: false, reason: null, expiresAt: null, actionType: null });
        setIsVip(false);
        setIsLoading(false);
        return;
      }

      // Check VIP status - wrap in try-catch for network resilience
      try {
        const { data: vipData } = await (supabase as any).rpc('is_vip', { _user_id: user.id });
        const userIsVip = vipData === true;
        setIsVip(userIsVip);

        // If VIP, check if we should show welcome popup
        if (userIsVip) {
          const vipWelcomeShown = localStorage.getItem(`urbanshade_vip_welcome_${user.id}`);
          if (!vipWelcomeShown) {
            // Fetch VIP reason
            const { data: vipRecord } = await (supabase as any)
              .from('vips')
              .select('reason')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (vipRecord) {
              setVipReason(vipRecord.reason);
              setShowVipWelcome(true);
            }
          }
        }
      } catch (vipError) {
        console.warn('VIP check failed (possibly offline):', vipError);
        // Continue without VIP info
      }

      // Check for active bans - wrap in try-catch for network resilience
      try {
        const { data: banData, error } = await (supabase as any)
          .from('moderation_actions')
          .select('*')
          .eq('target_user_id', user.id)
          .eq('is_active', true)
          .in('action_type', ['ban', 'temp_ban', 'perm_ban'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Ban check query failed:', error.message);
          setIsLoading(false);
          return;
        }

        if (banData) {
          // Check if ban has expired
          if (banData.expires_at && new Date(banData.expires_at) < new Date()) {
            // Ban has expired - don't block
            setBanInfo({ isBanned: false, isFakeBan: false, isTempBan: false, reason: null, expiresAt: null, actionType: null });
          } else {
            const isTempBan = banData.action_type === 'temp_ban' || (banData.expires_at !== null);
            setBanInfo({
              isBanned: true,
              isFakeBan: banData.is_fake || false,
              isTempBan,
              reason: banData.reason,
              expiresAt: banData.expires_at ? new Date(banData.expires_at) : null,
              actionType: banData.action_type,
            });
          }
        } else {
          setBanInfo({ isBanned: false, isFakeBan: false, isTempBan: false, reason: null, expiresAt: null, actionType: null });
        }
      } catch (banError) {
        console.warn('Ban check failed (possibly offline):', banError);
        setBanInfo({ isBanned: false, isFakeBan: false, isTempBan: false, reason: null, expiresAt: null, actionType: null });
      }

      // Check for unacknowledged warnings
      try {
        const { data: warnData } = await (supabase as any)
          .from('moderation_actions')
          .select('id, reason')
          .eq('target_user_id', user.id)
          .eq('is_active', true)
          .eq('action_type', 'warn')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (warnData) {
          const ackedWarnings: string[] = JSON.parse(localStorage.getItem(`urbanshade_ack_warnings_${user.id}`) || '[]');
          if (!ackedWarnings.includes(warnData.id)) {
            setPendingWarning({ id: warnData.id, reason: warnData.reason });
          } else {
            setPendingWarning(null);
          }
        } else {
          setPendingWarning(null);
        }
      } catch (warnError) {
        console.warn('Warning check failed (possibly offline):', warnError);
      }

    } catch (error) {
      // Handle any unexpected errors gracefully
      console.warn('Unexpected error in ban check:', error);
      // Don't block user on errors
      setBanInfo({ isBanned: false, isFakeBan: false, isTempBan: false, reason: null, expiresAt: null, actionType: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissVipWelcome = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`urbanshade_vip_welcome_${user.id}`, 'true');
    }
    setShowVipWelcome(false);
  }, []);

  const dismissTempBan = useCallback(() => {
    setTempBanDismissed(true);
  }, []);

  const acknowledgeWarning = useCallback(async () => {
    if (!pendingWarning) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const ackedWarnings: string[] = JSON.parse(localStorage.getItem(`urbanshade_ack_warnings_${user.id}`) || '[]');
      ackedWarnings.push(pendingWarning.id);
      localStorage.setItem(`urbanshade_ack_warnings_${user.id}`, JSON.stringify(ackedWarnings));
    }
    setPendingWarning(null);
  }, [pendingWarning]);

  useEffect(() => {
    checkBanStatus();

    // Re-check every 5 minutes
    const interval = setInterval(checkBanStatus, 5 * 60 * 1000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkBanStatus();
        setTempBanDismissed(false); // Reset temp ban dismiss on new login
      } else if (event === 'SIGNED_OUT') {
        setBanInfo({ isBanned: false, isFakeBan: false, isTempBan: false, reason: null, expiresAt: null, actionType: null });
        setIsVip(false);
        setShowVipWelcome(false);
        setTempBanDismissed(false);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkBanStatus]);

  return {
    ...banInfo,
    isLoading,
    isVip,
    vipReason,
    showVipWelcome,
    tempBanDismissed,
    pendingWarning,
    dismissVipWelcome,
    dismissTempBan,
    acknowledgeWarning,
    refreshBanStatus: checkBanStatus,
  };
};
