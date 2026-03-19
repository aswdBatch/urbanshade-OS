import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getXpForLevel, getTotalXpForLevel } from '@/lib/quests';
import { toast } from 'sonner';

interface BattlePassSeason {
  id: string;
  season_key: string;
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  max_level: number;
  rewards: Array<{
    level: number;
    type: string;
    value: string;
    name: string;
  }>;
}

interface UserBattlePass {
  id: string;
  user_id: string;
  season_id: string;
  current_level: number;
  current_xp: number;
  total_xp_earned: number;
  last_xp_tick: string;
  claimed_rewards: number[];
}

export const useBattlePass = (userId?: string) => {
  const [season, setSeason] = useState<BattlePassSeason | null>(null);
  const [progress, setProgress] = useState<UserBattlePass | null>(null);
  const [loading, setLoading] = useState(true);
  const passiveXpInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch active season and user progress
  const fetchBattlePass = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch active season
      const { data: seasonData, error: seasonError } = await supabase
        .from('battlepass_seasons')
        .select('*')
        .eq('is_active', true)
        .single();

      if (seasonError && seasonError.code !== 'PGRST116') throw seasonError;

      if (seasonData) {
        // Parse rewards JSON
        const parsedSeason = {
          ...seasonData,
          rewards: typeof seasonData.rewards === 'string' 
            ? JSON.parse(seasonData.rewards) 
            : seasonData.rewards
        };
        setSeason(parsedSeason);

        // Fetch or create user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_battlepass')
          .select('*')
          .eq('user_id', userId)
          .eq('season_id', seasonData.id)
          .single();

        if (progressError && progressError.code === 'PGRST116') {
          // Create new progress record
          const { data: newProgress, error: insertError } = await supabase
            .from('user_battlepass')
            .insert({
              user_id: userId,
              season_id: seasonData.id,
              current_level: 1,
              current_xp: 0,
              total_xp_earned: 0,
              claimed_rewards: [],
            })
            .select()
            .single();

          if (insertError) throw insertError;
          if (newProgress) {
            setProgress({
              ...newProgress,
              claimed_rewards: newProgress.claimed_rewards as number[] || []
            });
          }
        } else if (progressData) {
          setProgress({
            ...progressData,
            claimed_rewards: progressData.claimed_rewards as number[] || []
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch battle pass:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBattlePass();
  }, [fetchBattlePass]);

  // Passive XP tick (1 XP per minute)
  useEffect(() => {
    if (!userId || !progress) return;

    passiveXpInterval.current = setInterval(() => {
      grantXp(1, false); // Silent passive XP
    }, 60000); // Every minute

    return () => {
      if (passiveXpInterval.current) {
        clearInterval(passiveXpInterval.current);
      }
    };
  }, [userId, progress?.id]);

  // Grant XP and handle level-ups
  const grantXp = useCallback(async (amount: number, showToast: boolean = true) => {
    if (!userId || !progress || !season) return;

    const newTotalXp = progress.total_xp_earned + amount;
    let newXp = progress.current_xp + amount;
    let newLevel = progress.current_level;
    let leveledUp = false;

    // Check for level ups
    while (newLevel < season.max_level) {
      const xpNeeded = getXpForLevel(newLevel);
      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel++;
        leveledUp = true;
      } else {
        break;
      }
    }

    // Cap at max level
    if (newLevel >= season.max_level) {
      newLevel = season.max_level;
    }

    try {
      const { error } = await supabase
        .from('user_battlepass')
        .update({
          current_xp: newXp,
          current_level: newLevel,
          total_xp_earned: newTotalXp,
          last_xp_tick: new Date().toISOString(),
        })
        .eq('id', progress.id);

      if (error) throw error;

      setProgress(prev => prev ? {
        ...prev,
        current_xp: newXp,
        current_level: newLevel,
        total_xp_earned: newTotalXp,
      } : null);

      if (leveledUp && showToast) {
        toast.success(`🎉 Level Up! You're now level ${newLevel}!`);
        
        // Check for new rewards
        const newRewards = season.rewards.filter(
          r => r.level === newLevel && !progress.claimed_rewards.includes(r.level)
        );
        if (newRewards.length > 0) {
          toast.info(`New reward unlocked: ${newRewards[0].name}`);
        }
      } else if (showToast && amount >= 10) {
        toast.success(`+${amount} XP`);
      }
    } catch (err) {
      console.error('Failed to grant XP:', err);
    }
  }, [userId, progress, season]);

  // Claim a reward
  const claimReward = useCallback(async (level: number) => {
    if (!progress || !season) return false;

    if (progress.current_level < level) {
      toast.error('Reach this level first!');
      return false;
    }

    if (progress.claimed_rewards.includes(level)) {
      toast.error('Already claimed!');
      return false;
    }

    const reward = season.rewards.find(r => r.level === level);
    if (!reward) return false;

    try {
      const newClaimedRewards = [...progress.claimed_rewards, level];

      const { error } = await supabase
        .from('user_battlepass')
        .update({ claimed_rewards: newClaimedRewards })
        .eq('id', progress.id);

      if (error) throw error;

      setProgress(prev => prev ? { ...prev, claimed_rewards: newClaimedRewards } : null);
      
      // Handle reward type
      if (reward.type === 'title') {
        // Grant title
        await supabase.from('user_titles').insert({
          user_id: userId,
          title_id: reward.value,
          title_name: reward.name.replace(' Title', ''),
          source: 'battlepass',
        });
      }

      toast.success(`Claimed: ${reward.name}!`);
      return true;
    } catch (err) {
      console.error('Failed to claim reward:', err);
      return false;
    }
  }, [progress, season, userId]);

  // Calculate progress percentage for current level
  const getLevelProgress = useCallback(() => {
    if (!progress) return 0;
    const xpNeeded = getXpForLevel(progress.current_level);
    return Math.min(100, Math.round((progress.current_xp / xpNeeded) * 100));
  }, [progress]);

  // Get XP needed for current level
  const getXpNeeded = useCallback(() => {
    if (!progress) return 100;
    return getXpForLevel(progress.current_level);
  }, [progress]);

  // Get time until season ends
  const getTimeRemaining = useCallback(() => {
    if (!season) return null;
    const end = new Date(season.ends_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Season ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  }, [season]);

  // Check if a reward is unlocked but not claimed
  const canClaimReward = useCallback((level: number) => {
    if (!progress) return false;
    return progress.current_level >= level && !progress.claimed_rewards.includes(level);
  }, [progress]);

  // Check if a reward is unlocked
  const isRewardUnlocked = useCallback((level: number) => {
    if (!progress) return false;
    return progress.current_level >= level;
  }, [progress]);

  return {
    season,
    progress,
    loading,
    grantXp,
    claimReward,
    getLevelProgress,
    getXpNeeded,
    getTimeRemaining,
    canClaimReward,
    isRewardUnlocked,
    refetch: fetchBattlePass,
  };
};
