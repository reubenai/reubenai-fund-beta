import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers per Lovable guidelines
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars in ic-memo-pdf-exporter");
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || undefined;
    const payload = await req.json().catch(() => ({}));

    // Simple health check support used by readiness tests
    if (payload && payload.test) {
      return new Response(
        JSON.stringify({ ok: true, shim: "ic-memo-pdf-exporter", message: "Shim is up" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[ic-memo-pdf-exporter] Proxying to enhanced-pdf-generator with payload keys:", Object.keys(payload || {}));

    // Proxy/invoke the new function while preserving auth
    const { data, error } = await supabase.functions.invoke("enhanced-pdf-generator", {
      body: payload,
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (error) {
      console.error("[ic-memo-pdf-exporter] Downstream error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message || "PDF generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ic-memo-pdf-exporter] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
