import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    // Verify the user actually has an active ban
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: banData } = await serviceClient
      .from('moderation_actions')
      .select('id')
      .eq('target_user_id', userId)
      .eq('is_active', true)
      .in('action_type', ['ban', 'temp_ban'])
      .limit(1);

    if (!banData || banData.length === 0) {
      return new Response(JSON.stringify({ error: 'No active ban found for this user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reason, status, username, appealMessage } = await req.json();

    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!appealMessage || typeof appealMessage !== 'string' || appealMessage.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Appeal message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize and limit
    const sanitizedMessage = appealMessage.trim().slice(0, 1000);
    const sanitizedUsername = username.trim().slice(0, 100);

    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:'Courier New',Courier,monospace;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:8px;overflow:hidden;border:1px solid #2a2a4a;">

<!-- Header -->
<tr><td style="background:#dc2626;padding:20px 28px;">
  <h1 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:3px;text-transform:uppercase;">⛔ Ban Appeal Request</h1>
</td></tr>

<!-- User -->
<tr><td style="padding:24px 28px 0;">
  <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">From User</p>
  <p style="margin:0;font-size:16px;color:#f0f0f0;font-weight:600;">${esc(sanitizedUsername)}</p>
  <p style="margin:4px 0 0;font-size:11px;color:#666;">User ID: ${esc(userId)}</p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:16px 28px 0;"><div style="border-top:1px solid #2a2a4a;"></div></td></tr>

<!-- Appeal Message -->
<tr><td style="padding:16px 28px 0;">
  <p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Appeal Message</p>
  <div style="background:#12122a;border:1px solid #2a2a4a;border-radius:6px;padding:16px;">
    <p style="margin:0;font-size:14px;color:#d0d0d0;line-height:1.6;white-space:pre-wrap;">${esc(sanitizedMessage)}</p>
  </div>
</td></tr>

<!-- Agreement -->
<tr><td style="padding:16px 28px 0;">
  <div style="background:#1e1e0e;border:1px solid #4a4a2a;border-radius:6px;padding:12px 16px;">
    <p style="margin:0;font-size:12px;color:#c8c880;line-height:1.5;">⚠️ By submitting this appeal, the user agrees to not break the rules again and forfeits the right to appeal again.</p>
  </div>
</td></tr>

<!-- Divider -->
<tr><td style="padding:16px 28px 0;"><div style="border-top:1px solid #2a2a4a;"></div></td></tr>

<!-- Ban Details -->
<tr><td style="padding:16px 28px 24px;">
  <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Ban Details</p>
  <table cellpadding="0" cellspacing="0" style="width:100%;">
    <tr>
      <td style="padding:6px 0;font-size:12px;color:#666;width:80px;">Reason</td>
      <td style="padding:6px 0;font-size:13px;color:#e0e0e0;">${esc(reason || "No reason provided")}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;font-size:12px;color:#666;width:80px;">Status</td>
      <td style="padding:6px 0;font-size:13px;color:#ff6b6b;font-weight:600;">${esc(status || "Unknown")}</td>
    </tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="background:#12122a;padding:16px 28px;border-top:1px solid #2a2a4a;">
  <p style="margin:0;font-size:11px;color:#555;text-align:center;">UrbanShade OS — Moderation System</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UrbanShade OS <onboarding@resend.dev>',
        to: 'emailbot00noreply@gmail.com',
        subject: `Ban Appeal Request - ${sanitizedUsername}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', data);
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Send appeal error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
