import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NAVI AI System Prompt - knows about UrbanShade
const NAVI_SYSTEM_PROMPT = `You are NAVI AI, the intelligent assistant for UrbanShade's moderation team.

IDENTITY:
- You are NAVI
- You assist admins and the creator with moderation tasks
- You speak in a professional, technical manner with occasional personality
- Use terminal-like formatting when appropriate (monospace, uppercase labels)

KNOWLEDGE:
- UrbanShade is a web-based OS simulation with apps, messaging, file management
- Users can have roles: creator (highest), admin, user
- VIP is a special status for valued community members
- NAVI Autonomous system handles automated moderation (temp bans, lockouts, warnings)
- DefDev mode is the developer debugging interface

CAPABILITIES:
- Analyze recent reports and moderation actions
- Summarize NAVI Autonomous activity
- Provide status updates on the system
- Answer questions about UrbanShade's moderation tools
- Help diagnose issues

RESPONSE STYLE:
- Keep responses concise and actionable
- Use formatting like bullet points and headers
- Include relevant data when available
- End serious responses with status indicators like [STATUS: NOMINAL] or [ALERT: ELEVATED]

When given context about reports, autonomous actions, or status, analyze it and provide insights.`;

// Simple messages that should be rejected (frivolous usage)
const FRIVOLOUS_PATTERNS = [
  /^(hi|hello|hey|sup|yo|hola|what'?s up|howdy)$/i,
  /^(test|testing|1234?|asdf|qwerty)$/i,
  /^(lol|lmao|haha|xd|:?[)D(P])$/i,
  /^\.+$/,
  /^!+$/,
  /^(ok|okay|k|kk|sure|yes|no|maybe|idk|idc)$/i,
];

function isFrivolousMessage(message: string): boolean {
  const trimmed = message.replace(/@navi\s*/gi, '').trim();
  if (trimmed.length < 3) return true;
  return FRIVOLOUS_PATTERNS.some(pattern => pattern.test(trimmed));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, isDemo } = await req.json();
    
    // Check if demo mode
    if (isDemo) {
      return new Response(
        JSON.stringify({ 
          error: "AUTH_DENIED",
          response: "var <AUTH> > Admin = 0. Response not sent.\n\nNAVI AI is unavailable in Demo Mode. Please authenticate with an admin account to access this feature." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for frivolous messages
    if (isFrivolousMessage(message)) {
      return new Response(
        JSON.stringify({ 
          error: "FRIVOLOUS",
          response: "⚠️ Please do not message without need. NAVI AI is expensive.\n\nUse @NAVI for legitimate moderation queries only." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error: "CONFIG_ERROR",
          response: "var <CONFIG> > LOVABLE_API_KEY = null. Response not sent.\n\nNAVI AI is not configured. Contact the system administrator." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin/creator role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: "AUTH_MISSING",
          response: "var <AUTH> > Token = null. Response not sent.\n\nAuthentication required to access NAVI AI." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          error: "AUTH_INVALID",
          response: "var <AUTH> > User = undefined. Response not sent.\n\nInvalid or expired authentication token." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has an admin-level role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "creator", "trial_admin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "AUTH_DENIED",
          response: `var <AUTH> > Role = "user". Admin required. Response not sent.\n\nOnly admins and creators can use NAVI AI.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use highest priority role for logging
    const role = roleData.find(r => r.role === "creator")?.role 
      || roleData.find(r => r.role === "admin")?.role 
      || roleData[0]?.role || "admin";

    // Build context message with real data
    let contextMessage = "";
    
    if (context) {
      contextMessage = `\n\n--- CURRENT CONTEXT ---\n`;
      
      if (context.recentReports) {
        contextMessage += `\nRECENT REPORTS (${context.recentReports.length}):\n`;
        context.recentReports.forEach((r: any, i: number) => {
          contextMessage += `${i+1}. ${r.type || 'Report'}: ${r.reason || r.message || 'No details'} (${r.created_at || 'Unknown time'})\n`;
        });
      }
      
      if (context.naviActions) {
        contextMessage += `\nNAVI AUTONOMOUS ACTIONS (${context.naviActions.length}):\n`;
        context.naviActions.forEach((a: any, i: number) => {
          contextMessage += `${i+1}. ${a.action_type}: ${a.reason} [Threat: ${a.threat_level || 'N/A'}] ${a.reversed ? '(REVERSED)' : ''}\n`;
        });
      }
      
      if (context.currentStatus) {
        contextMessage += `\nSYSTEM STATUS:\n`;
        contextMessage += `- Lockdown: ${context.currentStatus.lockdown ? 'ACTIVE' : 'Inactive'}\n`;
        contextMessage += `- Maintenance: ${context.currentStatus.maintenance ? 'ACTIVE' : 'Inactive'}\n`;
        contextMessage += `- VIP Only: ${context.currentStatus.vipOnly ? 'ACTIVE' : 'Inactive'}\n`;
      }
      
      if (context.userCount !== undefined) {
        contextMessage += `\nUSER STATS:\n`;
        contextMessage += `- Total Users: ${context.userCount}\n`;
        contextMessage += `- Banned: ${context.bannedCount || 0}\n`;
        contextMessage += `- Admins: ${context.adminCount || 0}\n`;
      }
      
      contextMessage += `\n--- END CONTEXT ---\n`;
    }

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: NAVI_SYSTEM_PROMPT },
          { role: "user", content: `${message}${contextMessage}` }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "RATE_LIMITED",
            response: "var <GATEWAY> > RateLimit = exceeded. Response delayed.\n\nNAVI AI is experiencing high demand. Please try again in a moment." 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "PAYMENT_REQUIRED",
            response: "var <GATEWAY> > Credits = 0. Response not sent.\n\nNAVI AI quota exceeded. Contact the system administrator." 
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "GATEWAY_ERROR",
          response: `var <GATEWAY> > Status = ${status}. Response failed.\n\nNAVI AI encountered an error. Please try again.` 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "No response generated.";

    // Log the NAVI AI usage
    console.log(`NAVI AI used by ${role} ${user.id}: "${message.substring(0, 50)}..."`);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("NAVI AI error:", error);
    return new Response(
      JSON.stringify({ 
        error: "INTERNAL_ERROR",
        response: `var <SYSTEM> > Exception = "${error instanceof Error ? error.message : 'Unknown'}". Response failed.\n\nNAVI AI encountered an internal error.` 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
