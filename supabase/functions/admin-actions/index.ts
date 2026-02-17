import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed NAVI system user ID for system messages
const NAVI_USER_ID = '00000000-0000-0000-0000-000000000000';

// Constant-time comparison to prevent timing attacks
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// SHA-256 hash for PIN with per-user salt
async function hashPin(pin: string, userId?: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = userId ? `${userId}_urbanshade_pin_salt` : '_urbanshade_pin_salt';
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin, creator, or trial_admin - fetch ALL roles to handle multi-role users
    const { data: rolesData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'creator', 'trial_admin']);

    if (!rolesData || rolesData.length === 0) {
      console.log(`Access denied for user ${user.id} - not an admin or creator`);
      return new Response(JSON.stringify({ error: 'Access denied - admin or creator only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userRoles = rolesData.map(r => r.role);
    const isCreator = userRoles.includes('creator');
    const isTrialAdmin = !isCreator && userRoles.includes('trial_admin') && !userRoles.includes('admin');
    // Priority: creator > admin > trial_admin
    const adminRole = isCreator ? 'creator' : userRoles.includes('admin') ? 'admin' : 'trial_admin';

    // Update last_seen on access so online indicators work
    await supabaseAdmin
      .from('profiles')
      .update({ last_seen: new Date().toISOString(), is_online: true })
      .eq('user_id', user.id);

    console.log(`Admin ${user.id} (${adminRole}) accessing admin actions`);

    // Handle different actions based on method
    if (req.method === 'GET') {
      // Parse action from URL search params for GET requests
      const url = new URL(req.url);
      const action = url.searchParams.get('action') || 'users';
      
      if (action === 'users') {
        // Get all users with their profiles and moderation status
        const { data: profiles, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get moderation actions for each user
        const { data: moderationActions } = await supabaseAdmin
          .from('moderation_actions')
          .select('*')
          .eq('is_active', true);

        // Get user roles
        const { data: roles } = await supabaseAdmin
          .from('user_roles')
          .select('*');

        // Get VIPs
        const { data: vips } = await supabaseAdmin
          .from('vips')
          .select('*');

        const usersWithStatus = profiles?.map(p => {
          const userActions = moderationActions?.filter(a => a.target_user_id === p.user_id) || [];
          // Prioritize creator > admin > trial_admin > moderator > user
          const userRolesList = roles?.filter(r => r.user_id === p.user_id).map(r => r.role) || [];
          const bestRole = userRolesList.includes('creator') ? 'creator' : userRolesList.includes('admin') ? 'admin' : userRolesList.includes('trial_admin') ? 'trial_admin' : (userRolesList[0] || 'user');
          const isVip = vips?.some(v => v.user_id === p.user_id);
          const activeBan = userActions.find(a => 
            (a.action_type === 'temp_ban' || a.action_type === 'perm_ban' || a.action_type === 'ban') && 
            (!a.expires_at || new Date(a.expires_at) > new Date())
          );
          const warnings = userActions.filter(a => a.action_type === 'warn');

          return {
            ...p,
            role: bestRole,
            isVip,
            isBanned: !!activeBan,
            banInfo: activeBan,
            warningsCount: warnings.length,
            warnings
          };
        });

        return new Response(JSON.stringify({ users: usersWithStatus, isCreator, adminRole }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'logs') {
        const { data: logs, error } = await supabaseAdmin
          .from('moderation_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        return new Response(JSON.stringify({ logs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'vips') {
        const { data: vips, error } = await supabaseAdmin
          .from('vips')
          .select('*')
          .order('granted_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ vips }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'site_lock_status') {
        const { data: lock, error } = await supabaseAdmin
          .from('site_locks')
          .select('*')
          .eq('id', 'global')
          .maybeSingle();

        return new Response(JSON.stringify({ lock }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'navi_messages') {
        const { data: messages, error } = await supabaseAdmin
          .from('navi_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        return new Response(JSON.stringify({ messages }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'navi_settings') {
        const { data: settings, error } = await supabaseAdmin
          .from('navi_settings')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        const defaultSettings = {
          disable_signups: false,
          read_only_mode: false,
          maintenance_mode: false,
          disable_messages: false,
          vip_only_mode: false,
          lockdown_mode: false,
          maintenance_message: null
        };

        return new Response(JSON.stringify({ 
          settings: settings || defaultSettings,
          maintenanceMessage: settings?.maintenance_message || null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'monitoring_events') {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: events, error } = await supabaseAdmin
          .from('monitoring_events')
          .select('*')
          .gte('created_at', fiveMinAgo)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        return new Response(JSON.stringify({ events }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // PIN STATUS CHECK (GET)
      // =============================================
      if (action === 'check_pin_status') {
        const { data: pinData } = await supabaseAdmin
          .from('admin_pins')
          .select('user_id, failed_attempts, locked_until')
          .eq('user_id', user.id)
          .maybeSingle();

        const hasPin = !!pinData;
        let isLocked = false;
        if (pinData?.locked_until && new Date(pinData.locked_until) > new Date()) {
          isLocked = true;
        }

        return new Response(JSON.stringify({ hasPin, isLocked, lockedUntil: pinData?.locked_until }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // GET ADMIN NOTES (GET)
      // =============================================
      if (action === 'get_notes') {
        const targetUserId = url.searchParams.get('target_user_id');
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'Missing target_user_id' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: notes, error } = await supabaseAdmin
          .from('admin_notes')
          .select('*')
          .eq('target_user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        return new Response(JSON.stringify({ notes: notes || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // ADMIN ROSTER (GET)
      // =============================================
      if (action === 'admin_roster') {
        const { data: admins, error } = await supabaseAdmin
          .from('user_roles')
          .select('user_id, role, granted_at, granted_by')
          .in('role', ['admin', 'creator', 'trial_admin'])
          .order('granted_at', { ascending: false });

        if (error) throw error;

        // Get profiles for these admins
        const adminIds = admins?.map(a => a.user_id) || [];
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('user_id, username, display_name, last_seen, is_online')
          .in('user_id', adminIds);

        // Get PIN status for each admin
        const { data: pins } = await supabaseAdmin
          .from('admin_pins')
          .select('user_id, updated_at')
          .in('user_id', adminIds);

        const roster = admins?.map(a => {
          const profile = profiles?.find(p => p.user_id === a.user_id);
          const pin = pins?.find(p => p.user_id === a.user_id);
          return {
            ...a,
            username: profile?.username || 'Unknown',
            display_name: profile?.display_name,
            last_seen: profile?.last_seen,
            is_online: profile?.is_online,
            has_pin: !!pin,
            pin_updated: pin?.updated_at
          };
        }) || [];

        return new Response(JSON.stringify({ roster }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // ACCESS LOGS (GET)
      // =============================================
      if (action === 'access_logs') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const { data: accessLogs, error } = await supabaseAdmin
          .from('admin_access_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Get usernames for the logs
        const userIds = [...new Set(accessLogs?.map(l => l.user_id) || [])];
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        const logsWithNames = accessLogs?.map(l => ({
          ...l,
          username: profiles?.find(p => p.user_id === l.user_id)?.username || 'Unknown'
        })) || [];

        return new Response(JSON.stringify({ accessLogs: logsWithNames }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid GET action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const action = body.action;
      
      if (!action) {
        return new Response(JSON.stringify({ error: 'Missing action in request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`Processing action: ${action} (role: ${adminRole})`);

      // =============================================
      // PIN ACTIONS (with access logging)
      // =============================================

      if (action === 'set_pin') {
        const { pin } = body;
        if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
          return new Response(JSON.stringify({ error: 'PIN must be 4-6 digits' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const pinHash = await hashPin(pin, user.id);
        const { error } = await supabaseAdmin
          .from('admin_pins')
          .upsert({
            user_id: user.id,
            pin_hash: pinHash,
            failed_attempts: 0,
            locked_until: null,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        console.log(`Admin ${user.id} set/updated PIN`);

        // Log access
        await supabaseAdmin.from('admin_access_log').insert({ user_id: user.id, action: 'pin_set' });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'verify_pin') {
        const { pin } = body;
        if (!pin) {
          return new Response(JSON.stringify({ error: 'Missing PIN' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: pinData } = await supabaseAdmin
          .from('admin_pins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!pinData) {
          return new Response(JSON.stringify({ error: 'No PIN set' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check lockout
        if (pinData.locked_until && new Date(pinData.locked_until) > new Date()) {
          return new Response(JSON.stringify({ 
            error: 'Account locked', 
            locked: true, 
            lockedUntil: pinData.locked_until 
          }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const pinHash = await hashPin(pin, user.id);
        if (constantTimeEqual(pinHash, pinData.pin_hash)) {
          // Success - reset failed attempts
          await supabaseAdmin
            .from('admin_pins')
            .update({ failed_attempts: 0, locked_until: null })
            .eq('user_id', user.id);

          // Log success
          await supabaseAdmin.from('admin_access_log').insert({ user_id: user.id, action: 'pin_verify_success' });

          return new Response(JSON.stringify({ success: true, verified: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // Failed attempt
          const newAttempts = (pinData.failed_attempts || 0) + 1;
          const lockoutData: Record<string, any> = { failed_attempts: newAttempts };
          
          if (newAttempts >= 3) {
            lockoutData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
          }

          await supabaseAdmin
            .from('admin_pins')
            .update(lockoutData)
            .eq('user_id', user.id);

          // Log failure
          await supabaseAdmin.from('admin_access_log').insert({ 
            user_id: user.id, action: 'pin_verify_fail', 
            metadata: { attempts: newAttempts, locked: newAttempts >= 3 } 
          });

          return new Response(JSON.stringify({ 
            success: false, 
            verified: false, 
            attemptsLeft: Math.max(0, 3 - newAttempts),
            locked: newAttempts >= 3
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      if (action === 'remove_pin') {
        const { error } = await supabaseAdmin
          .from('admin_pins')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
        console.log(`Admin ${user.id} removed PIN`);

        // Log
        await supabaseAdmin.from('admin_access_log').insert({ user_id: user.id, action: 'pin_removed' });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // TRIAL ADMIN RESTRICTED ACTIONS CHECK
      // =============================================
      // Helper to block trial admins from high-impact actions
      const blockTrialAdmin = (actionName: string) => {
        if (isTrialAdmin) {
          return new Response(JSON.stringify({ error: `Trial admins cannot perform: ${actionName}` }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return null;
      };

      // =============================================
      // WARN ACTION
      // =============================================
      if (action === 'warn') {
        const { targetUserId, reason } = body;
        
        const { data, error } = await supabaseAdmin
          .from('moderation_actions')
          .insert({
            target_user_id: targetUserId,
            action_type: 'warn',
            reason,
            created_by: user.id,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Admin ${user.id} warned user ${targetUserId}: ${reason}`);

        return new Response(JSON.stringify({ success: true, action: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'remove_warning') {
        const { warningId, reason } = body;
        
        const { error: updateError } = await supabaseAdmin
          .from('moderation_actions')
          .update({ is_active: false })
          .eq('id', warningId);

        if (updateError) throw updateError;

        const { data, error } = await supabaseAdmin
          .from('moderation_actions')
          .insert({
            action_type: 'warning_removed',
            reason,
            created_by: user.id,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Admin ${user.id} removed warning ${warningId}: ${reason}`);

        return new Response(JSON.stringify({ success: true, action: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // BAN ACTION
      // =============================================
      if (action === 'ban') {
        const { targetUserId, reason, duration, isPermanent, isFake } = body;
        
        // Trial admins: no permanent bans, max 24h
        if (isTrialAdmin) {
          if (isPermanent) {
            return new Response(JSON.stringify({ error: 'Trial admins cannot issue permanent bans' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          if (duration && !['1h', '24h'].includes(duration)) {
            return new Response(JSON.stringify({ error: 'Trial admins can only issue bans up to 24 hours' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        let expiresAt = null;
        if (!isPermanent && duration) {
          const now = new Date();
          if (duration === '1h') expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
          else if (duration === '24h') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          else if (duration === '7d') expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          else if (duration === '30d') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        const { data, error } = await supabaseAdmin
          .from('moderation_actions')
          .insert({
            target_user_id: targetUserId,
            action_type: isPermanent ? 'perm_ban' : 'temp_ban',
            reason,
            expires_at: expiresAt?.toISOString() || null,
            created_by: user.id,
            is_active: true,
            is_fake: isFake || false
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Admin ${user.id} ${isFake ? 'fake ' : ''}banned user ${targetUserId}: ${reason} (${isPermanent ? 'permanent' : duration})`);

        return new Response(JSON.stringify({ success: true, action: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'unban') {
        const { targetUserId, reason } = body;
        
        const { error } = await supabaseAdmin
          .from('moderation_actions')
          .update({ is_active: false })
          .eq('target_user_id', targetUserId)
          .in('action_type', ['temp_ban', 'perm_ban', 'ban']);

        if (error) throw error;

        if (reason) {
          await supabaseAdmin
            .from('moderation_actions')
            .insert({
              target_user_id: targetUserId,
              action_type: 'unban',
              reason,
              created_by: user.id,
              is_active: true
            });
        }

        console.log(`Admin ${user.id} unbanned user ${targetUserId}: ${reason || 'No reason'}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'ip_ban') {
        const blocked = blockTrialAdmin('ip_ban');
        if (blocked) return blocked;

        const { targetIp, reason } = body;
        
        const { data, error } = await supabaseAdmin
          .from('moderation_actions')
          .insert({
            target_ip: targetIp,
            action_type: 'ip_ban',
            reason,
            created_by: user.id,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Admin ${user.id} IP banned ${targetIp}: ${reason}`);

        return new Response(JSON.stringify({ success: true, action: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // VIP SYSTEM ACTIONS
      // =============================================
      
      if (action === 'grant_vip') {
        const blocked = blockTrialAdmin('grant_vip');
        if (blocked) return blocked;

        const { targetUserId, reason } = body;
        
        const { data, error } = await supabaseAdmin
          .from('vips')
          .insert({
            user_id: targetUserId,
            granted_by: user.id,
            reason
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(JSON.stringify({ error: 'User is already VIP' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw error;
        }
        console.log(`Admin ${user.id} granted VIP to user ${targetUserId}: ${reason}`);

        return new Response(JSON.stringify({ success: true, vip: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'revoke_vip') {
        const blocked = blockTrialAdmin('revoke_vip');
        if (blocked) return blocked;

        const { targetUserId } = body;
        
        const { error } = await supabaseAdmin
          .from('vips')
          .delete()
          .eq('user_id', targetUserId);

        if (error) throw error;
        console.log(`Admin ${user.id} revoked VIP from user ${targetUserId}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // SITE LOCK ACTIONS
      // =============================================
      
      if (action === 'lock_site') {
        const blocked = blockTrialAdmin('lock_site');
        if (blocked) return blocked;

        const { reason } = body;
        
        const { data: existing } = await supabaseAdmin
          .from('site_locks')
          .select('id')
          .eq('id', 'global')
          .maybeSingle();

        if (existing) {
          const { data, error } = await supabaseAdmin
            .from('site_locks')
            .update({
              is_locked: true,
              lock_reason: reason,
              locked_at: new Date().toISOString(),
              locked_by: user.id
            })
            .eq('id', 'global')
            .select()
            .single();

          if (error) throw error;
          console.log(`Admin ${user.id} locked site: ${reason}`);

          return new Response(JSON.stringify({ success: true, lock: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          const { data, error } = await supabaseAdmin
            .from('site_locks')
            .insert({
              id: 'global',
              is_locked: true,
              lock_reason: reason,
              locked_at: new Date().toISOString(),
              locked_by: user.id
            })
            .select()
            .single();

          if (error) throw error;
          console.log(`Admin ${user.id} locked site: ${reason}`);

          return new Response(JSON.stringify({ success: true, lock: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      if (action === 'unlock_site') {
        const blocked = blockTrialAdmin('unlock_site');
        if (blocked) return blocked;

        const { data, error } = await supabaseAdmin
          .from('site_locks')
          .update({
            is_locked: false,
            lock_reason: null,
            locked_at: null,
            locked_by: null
          })
          .eq('id', 'global')
          .select()
          .single();

        if (error) throw error;
        console.log(`Admin ${user.id} unlocked site`);

        return new Response(JSON.stringify({ success: true, lock: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // NAVI MESSAGE ACTIONS
      // =============================================
      
      if (action === 'navi_message') {
        const blocked = blockTrialAdmin('navi_message');
        if (blocked) return blocked;

        const { message, priority, target } = body;
        
        const { data: naviMsg, error: naviError } = await supabaseAdmin
          .from('navi_messages')
          .insert({
            message,
            priority: priority || 'info',
            target_audience: target || 'all',
            sent_by: user.id
          })
          .select()
          .single();

        if (naviError) throw naviError;

        let targetUserIds: string[] = [];
        
        if (target === 'all' || !target) {
          const { data: allProfiles } = await supabaseAdmin.from('profiles').select('user_id');
          targetUserIds = allProfiles?.map(p => p.user_id) || [];
        } else if (target === 'vips') {
          const { data: vips } = await supabaseAdmin.from('vips').select('user_id');
          targetUserIds = vips?.map(v => v.user_id) || [];
        } else if (target === 'admins') {
          const { data: admins } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin');
          targetUserIds = admins?.map(a => a.user_id) || [];
        }

        if (targetUserIds.length > 0) {
          const inboxMessages = targetUserIds.map(recipientId => ({
            sender_id: user.id,
            recipient_id: recipientId,
            subject: `[NAVI ${priority?.toUpperCase() || 'INFO'}] System Announcement`,
            body: message,
            priority: priority === 'critical' ? 'urgent' : priority === 'warning' ? 'high' : 'normal',
            message_type: 'navi_broadcast',
            metadata: { navi_message_id: naviMsg.id, broadcast_target: target }
          }));

          const { error: inboxError } = await supabaseAdmin.from('messages').insert(inboxMessages);
          if (inboxError) console.error('Error delivering NAVI messages:', inboxError);
          else console.log(`NAVI message delivered to ${targetUserIds.length} users`);
        }

        console.log(`Admin ${user.id} sent NAVI message (${priority}/${target}): ${message.substring(0, 50)}...`);

        return new Response(JSON.stringify({ success: true, naviMessage: naviMsg, deliveredTo: targetUserIds.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // OP/DEOP ACTIONS
      // =============================================
      
      if (action === 'op') {
        const blocked = blockTrialAdmin('op');
        if (blocked) return blocked;

        const { targetUserId } = body;
        
        const { data: existing } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('role', 'admin')
          .maybeSingle();

        if (existing) {
          return new Response(JSON.stringify({ error: 'User is already an admin' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data, error } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: targetUserId, role: 'admin', granted_by: user.id })
          .select()
          .single();

        if (error) throw error;
        console.log(`Admin ${user.id} granted admin to user ${targetUserId}`);

        return new Response(JSON.stringify({ success: true, role: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'deop') {
        const { targetUserId } = body;
        
        const { data: targetRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', targetUserId)
          .maybeSingle();
          
        if (targetRole?.role === 'creator') {
          return new Response(JSON.stringify({ error: 'Cannot demote a creator' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Full admins can only be demoted by creators; trial admins can be demoted by any admin
        if (targetRole?.role === 'admin' && !isCreator) {
          return new Response(JSON.stringify({ error: 'Only creators can demote full admins' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const { error } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', targetUserId)
          .eq('role', 'admin');

        if (error) throw error;
        console.log(`Creator ${user.id} revoked admin from user ${targetUserId}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // TRIAL ADMIN MANAGEMENT
      // =============================================

      if (action === 'set_trial_admin') {
        // Only full admins/creators can grant trial admin
        if (isTrialAdmin) {
          return new Response(JSON.stringify({ error: 'Trial admins cannot grant trial admin' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { targetUserId } = body;
        
        // Check if already has a role
        const { data: existing } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (existing && ['admin', 'creator'].includes(existing.role)) {
          return new Response(JSON.stringify({ error: 'User already has a higher role' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (existing) {
          // Update existing role
          const { error } = await supabaseAdmin
            .from('user_roles')
            .update({ role: 'trial_admin', granted_by: user.id })
            .eq('user_id', targetUserId);
          if (error) throw error;
        } else {
          const { error } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: targetUserId, role: 'trial_admin', granted_by: user.id });
          if (error) throw error;
        }

        console.log(`Admin ${user.id} granted trial_admin to ${targetUserId}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'promote_trial') {
        if (isTrialAdmin) {
          return new Response(JSON.stringify({ error: 'Trial admins cannot promote' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { targetUserId } = body;
        const { error } = await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin', granted_by: user.id })
          .eq('user_id', targetUserId)
          .eq('role', 'trial_admin');

        if (error) throw error;
        console.log(`Admin ${user.id} promoted trial_admin ${targetUserId} to admin`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // BROADCAST ACTION
      // =============================================
      
      if (action === 'broadcast') {
        const blocked = blockTrialAdmin('broadcast');
        if (blocked) return blocked;

        const { message } = body;
        
        const { data, error } = await supabaseAdmin
          .from('navi_messages')
          .insert({
            message,
            priority: 'critical',
            target_audience: 'all',
            sent_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        
        const { data: allProfiles } = await supabaseAdmin.from('profiles').select('user_id');
        const targetUserIds = allProfiles?.map(p => p.user_id) || [];
        
        if (targetUserIds.length > 0) {
          const inboxMessages = targetUserIds.map(recipientId => ({
            sender_id: user.id,
            recipient_id: recipientId,
            subject: `[BROADCAST] Global Announcement`,
            body: message,
            priority: 'urgent',
            message_type: 'navi_broadcast',
            metadata: { navi_message_id: data.id, broadcast_target: 'all' }
          }));

          const { error: inboxError } = await supabaseAdmin.from('messages').insert(inboxMessages);
          if (inboxError) console.error('Failed to deliver broadcast:', inboxError);
          else console.log(`Broadcast delivered to ${targetUserIds.length} users`);
        }
        
        console.log(`Admin ${user.id} sent broadcast: ${message.substring(0, 50)}...`);

        return new Response(JSON.stringify({ success: true, broadcast: data, deliveredTo: targetUserIds.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // NAVI SETTINGS ACTIONS
      // =============================================
      
      if (action === 'set_navi_setting') {
        const blocked = blockTrialAdmin('set_navi_setting');
        if (blocked) return blocked;

        const { setting, value, message } = body;
        
        const validSettings = ['disable_signups', 'read_only_mode', 'maintenance_mode', 'disable_messages', 'vip_only_mode', 'lockdown_mode'];
        if (!validSettings.includes(setting)) {
          return new Response(JSON.stringify({ error: 'Invalid setting' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: existing } = await supabaseAdmin.from('navi_settings').select('id').single();

        const updateData: Record<string, any> = {
          [setting]: value,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        };

        if (setting === 'maintenance_mode' && message) {
          updateData.maintenance_message = message;
        }

        if (existing) {
          const { data, error } = await supabaseAdmin
            .from('navi_settings')
            .update(updateData)
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return new Response(JSON.stringify({ success: true, settings: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          const initialSettings = {
            disable_signups: false, read_only_mode: false, maintenance_mode: false,
            disable_messages: false, vip_only_mode: false, lockdown_mode: false,
            ...updateData
          };

          const { data, error } = await supabaseAdmin
            .from('navi_settings')
            .insert(initialSettings)
            .select()
            .single();

          if (error) throw error;
          return new Response(JSON.stringify({ success: true, settings: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // =============================================
      // BULK ACTIONS
      // =============================================
      
      if (action === 'bulk_warn') {
        const { targetUserIds, reason } = body;
        const inserts = targetUserIds.map((targetUserId: string) => ({
          target_user_id: targetUserId, action_type: 'warn', reason, created_by: user.id, is_active: true
        }));

        const { data, error } = await supabaseAdmin.from('moderation_actions').insert(inserts).select();
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, count: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'bulk_ban') {
        const { targetUserIds, reason, duration, isPermanent } = body;

        if (isTrialAdmin && (isPermanent || (duration && !['1h', '24h'].includes(duration)))) {
          return new Response(JSON.stringify({ error: 'Trial admins: max 24h bans only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        let expiresAt = null;
        if (!isPermanent && duration) {
          const now = new Date();
          if (duration === '1h') expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
          else if (duration === '24h') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          else if (duration === '7d') expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          else if (duration === '30d') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        const inserts = targetUserIds.map((targetUserId: string) => ({
          target_user_id: targetUserId, action_type: isPermanent ? 'perm_ban' : 'temp_ban',
          reason, expires_at: expiresAt?.toISOString() || null, created_by: user.id, is_active: true, is_fake: false
        }));

        const { data, error } = await supabaseAdmin.from('moderation_actions').insert(inserts).select();
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, count: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'bulk_vip') {
        const blocked = blockTrialAdmin('bulk_vip');
        if (blocked) return blocked;

        const { targetUserIds, reason } = body;
        const inserts = targetUserIds.map((targetUserId: string) => ({
          user_id: targetUserId, granted_by: user.id, reason
        }));

        const { data, error } = await supabaseAdmin.from('vips').insert(inserts).select();
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, count: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // EXTENDED MANAGEMENT ACTIONS
      // =============================================

      if (action === 'set_clearance') {
        const { targetUserId, clearance } = body;
        if (typeof clearance !== 'number' || clearance < 1 || clearance > 5) {
          return new Response(JSON.stringify({ error: 'Clearance must be 1-5' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ clearance })
          .eq('user_id', targetUserId);

        if (error) throw error;
        console.log(`Admin ${user.id} set clearance ${clearance} for user ${targetUserId}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'reset_password') {
        const blocked = blockTrialAdmin('reset_password');
        if (blocked) return blocked;

        const { targetUserId } = body;
        
        // Get user email
        const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (userError || !targetUser?.user?.email) {
          return new Response(JSON.stringify({ error: 'Could not find user email' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Send password reset
        const { error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: targetUser.user.email
        });

        if (error) throw error;
        console.log(`Admin ${user.id} triggered password reset for ${targetUserId}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'force_logout') {
        const blocked = blockTrialAdmin('force_logout');
        if (blocked) return blocked;

        const { targetUserId } = body;
        
        const { error } = await supabaseAdmin.auth.admin.signOut(targetUserId);
        if (error) throw error;
        
        console.log(`Admin ${user.id} force logged out user ${targetUserId}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'add_note') {
        const { targetUserId, note } = body;
        if (!note?.trim()) {
          return new Response(JSON.stringify({ error: 'Note cannot be empty' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data, error } = await supabaseAdmin
          .from('admin_notes')
          .insert({
            target_user_id: targetUserId,
            author_id: user.id,
            note: note.trim()
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Admin ${user.id} added note for user ${targetUserId}`);

        return new Response(JSON.stringify({ success: true, note: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'delete_note') {
        const { noteId } = body;
        const { error } = await supabaseAdmin.from('admin_notes').delete().eq('id', noteId);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // TEST EMERGENCY ACTIONS
      // =============================================
      
      if (action === 'start_test_emergency') {
        const blocked = blockTrialAdmin('start_test_emergency');
        if (blocked) return blocked;

        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        
        const { data: recentEmergency } = await supabaseAdmin
          .from('test_emergencies')
          .select('*')
          .eq('initiated_by', user.id)
          .gte('started_at', twelveHoursAgo)
          .single();
        
        if (recentEmergency) {
          const nextAvailable = new Date(new Date(recentEmergency.started_at).getTime() + 12 * 60 * 60 * 1000);
          return new Response(JSON.stringify({ 
            error: 'Rate limited', 
            message: `You can only start one test emergency every 12 hours. Next available: ${nextAvailable.toISOString()}`,
            nextAvailable: nextAvailable.toISOString()
          }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const fakeData = {
          signups_spike: Math.floor(Math.random() * 500) + 100,
          failed_logins: Math.floor(Math.random() * 300) + 50,
          messages_spam: Math.floor(Math.random() * 1000) + 200,
          threat_level: ['elevated', 'high', 'critical'][Math.floor(Math.random() * 3)],
          affected_systems: ['auth', 'messaging', 'storage'].slice(0, Math.floor(Math.random() * 3) + 1),
          simulated_users: Array.from({ length: 5 }, (_, i) => ({
            username: `TestUser${i + 1}`,
            threat_score: Math.floor(Math.random() * 100),
            activity: ['suspicious_login', 'spam', 'brute_force'][Math.floor(Math.random() * 3)]
          }))
        };

        const { data: emergency, error: emergencyError } = await supabaseAdmin
          .from('test_emergencies')
          .insert({
            initiated_by: user.id,
            is_active: true,
            fake_data: fakeData,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (emergencyError) throw emergencyError;

        const { data: admins } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .in('role', ['admin', 'moderator', 'creator']);

        const adminIds = admins?.map(a => a.user_id) || [];

        if (adminIds.length > 0) {
          const { data: naviMsg } = await supabaseAdmin
            .from('navi_messages')
            .insert({
              message: `🚨 TEST EMERGENCY initiated by an admin. This is a drill to test moderation response. Fake data is being used. Emergency ID: ${emergency.id}`,
              priority: 'warning',
              target_audience: 'admins',
              sent_by: user.id
            })
            .select()
            .single();

          const inboxMessages = adminIds.map(recipientId => ({
            sender_id: user.id,
            recipient_id: recipientId,
            subject: `[TEST EMERGENCY] Moderation Drill Started`,
            body: `A test emergency has been initiated. This is a drill.\n\nEmergency ID: ${emergency.id}\nThreat Level: ${fakeData.threat_level}\nAffected Systems: ${fakeData.affected_systems.join(', ')}`,
            priority: 'urgent',
            message_type: 'navi_broadcast',
            metadata: { emergency_id: emergency.id, is_test: true }
          }));

          await supabaseAdmin.from('messages').insert(inboxMessages);
        }

        console.log(`Admin ${user.id} started test emergency: ${emergency.id}`);

        return new Response(JSON.stringify({ success: true, emergency, notifiedAdmins: adminIds.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'end_test_emergency') {
        const { emergencyId } = body;
        
        const { data, error } = await supabaseAdmin
          .from('test_emergencies')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('id', emergencyId)
          .select()
          .single();

        if (error) throw error;

        const { data: admins } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .in('role', ['admin', 'moderator', 'creator']);

        const adminIds = admins?.map(a => a.user_id) || [];

        if (adminIds.length > 0) {
          const inboxMessages = adminIds.map(recipientId => ({
            sender_id: user.id,
            recipient_id: recipientId,
            subject: `[TEST EMERGENCY ENDED] Drill Complete`,
            body: `The test emergency has been concluded.\n\nEmergency ID: ${emergencyId}`,
            priority: 'normal',
            message_type: 'navi_broadcast',
            metadata: { emergency_id: emergencyId, is_test: true }
          }));

          await supabaseAdmin.from('messages').insert(inboxMessages);
        }

        console.log(`Admin ${user.id} ended test emergency: ${emergencyId}`);

        return new Response(JSON.stringify({ success: true, emergency: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'get_active_test_emergency') {
        const { data, error } = await supabaseAdmin
          .from('test_emergencies')
          .select('*')
          .eq('is_active', true)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        return new Response(JSON.stringify({ success: true, emergency: data || null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'get_test_emergency_cooldown') {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        
        const { data: recentEmergency } = await supabaseAdmin
          .from('test_emergencies')
          .select('started_at')
          .eq('initiated_by', user.id)
          .gte('started_at', twelveHoursAgo)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (recentEmergency) {
          const nextAvailable = new Date(new Date(recentEmergency.started_at).getTime() + 12 * 60 * 60 * 1000);
          return new Response(JSON.stringify({ success: true, onCooldown: true, nextAvailable: nextAvailable.toISOString() }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true, onCooldown: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // =============================================
      // CREATOR-ONLY ACTIONS
      // =============================================

      if (action === 'force_reset_pin') {
        if (!isCreator) {
          return new Response(JSON.stringify({ error: 'Creator only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { targetUserId } = body;
        const { error } = await supabaseAdmin.from('admin_pins').delete().eq('user_id', targetUserId);
        if (error) throw error;

        await supabaseAdmin.from('admin_access_log').insert({ 
          user_id: user.id, action: 'force_pin_reset', 
          metadata: { target: targetUserId } 
        });

        console.log(`Creator ${user.id} force-reset PIN for ${targetUserId}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'clear_all_bans') {
        if (!isCreator) {
          return new Response(JSON.stringify({ error: 'Creator only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { error } = await supabaseAdmin
          .from('moderation_actions')
          .update({ is_active: false })
          .in('action_type', ['temp_ban', 'perm_ban', 'ban'])
          .eq('is_active', true);
        if (error) throw error;

        console.log(`Creator ${user.id} cleared all active bans`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'clear_all_warnings') {
        if (!isCreator) {
          return new Response(JSON.stringify({ error: 'Creator only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { error } = await supabaseAdmin
          .from('moderation_actions')
          .update({ is_active: false })
          .eq('action_type', 'warn')
          .eq('is_active', true);
        if (error) throw error;

        console.log(`Creator ${user.id} cleared all active warnings`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'revoke_all_trial_admins') {
        if (!isCreator) {
          return new Response(JSON.stringify({ error: 'Creator only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { data: deleted, error } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('role', 'trial_admin')
          .select();
        if (error) throw error;

        console.log(`Creator ${user.id} revoked all trial admins (${deleted?.length || 0})`);
        return new Response(JSON.stringify({ success: true, count: deleted?.length || 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'delete_all_pins') {
        if (!isCreator) {
          return new Response(JSON.stringify({ error: 'Creator only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        // Delete all PINs except the creator's own
        const { error } = await supabaseAdmin
          .from('admin_pins')
          .delete()
          .neq('user_id', user.id);
        if (error) throw error;

        await supabaseAdmin.from('admin_access_log').insert({ 
          user_id: user.id, action: 'delete_all_pins' 
        });

        console.log(`Creator ${user.id} deleted all admin PINs`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'reset_navi_defaults') {
        if (!isCreator) {
          return new Response(JSON.stringify({ error: 'Creator only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const defaults = {
          disable_signups: false, read_only_mode: false, maintenance_mode: false,
          disable_messages: false, vip_only_mode: false, lockdown_mode: false,
          maintenance_message: null, auto_lockdown_enabled: true, auto_temp_ban_enabled: true,
          auto_warn_enabled: true, updated_at: new Date().toISOString(), updated_by: user.id
        };
        const { error } = await supabaseAdmin.from('navi_settings').update(defaults).eq('id', 'global');
        if (error) throw error;

        console.log(`Creator ${user.id} reset NAVI to defaults`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: `Invalid action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Admin action error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
