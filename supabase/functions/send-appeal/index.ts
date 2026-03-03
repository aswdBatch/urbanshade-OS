import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const emailBody = `#------------------------------------------------#
| Unban request from user:
| ${sanitizedUsername}
#------------------------------------------------#
| Appeal message:
| ${sanitizedMessage}
#------------------------------------------------#
|
| By writing this email I agree to not break the rules again,
| and I lose my right to appeal again.
|
#------------------------------------------------#

Ban details:
- Reason: ${reason || "No reason provided"}
- Status: ${status || "Unknown"}`;

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
        text: emailBody,
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
