import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.6";

const VAPID_PUBLIC_KEY = "BIpzg6hQZ_toW3uv4PP6Edhg24tb3hnd8ZbnFw1BFyxnW3RKZ6ke7TVK07HtvT7AxlcFGjVXJEeUUWSYJ8vOVFc";
const VAPID_PRIVATE_KEY = "6mhQMmq4MCHg3asRn6gMTh1Sllc9BUgCA2_-SySQtYQ";

webpush.setVapidDetails(
  "mailto:tu-email@ejemplo.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse body for test mode
    let testUserId = null;
    try {
      const body = await req.json();
      testUserId = body.testUserId;
      console.log(`Test mode for user: ${testUserId}`);
    } catch (e) {
      console.log("Normal mode (no body or invalid JSON)");
    }

    const today = new Date().toISOString().split("T")[0];
    
    // 1. Get deadlines
    const { data: deadlines, error: dlError } = await supabaseClient
      .from("tax_deadlines")
      .select("*")
      .eq("expiration_date", today)
      .eq("completed", false);

    if (dlError) {
      console.error("Database error (deadlines):", dlError);
      throw dlError;
    }

    // 2. Get subscriptions (filtered if testing)
    let query = supabaseClient.from("push_subscriptions").select("*");
    if (testUserId) {
      query = query.eq("user_id", testUserId);
    }
    
    const { data: subscriptions, error: subError } = await query;
    if (subError) {
      console.error("Database error (subscriptions):", subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions to notify.`);

    // 3. Send notifications
    if (subscriptions && subscriptions.length > 0) {
      const sendPromises = subscriptions.map(async (sub) => {
        const payload = JSON.stringify({
          title: testUserId ? "🔔 Prueba de Notificación" : "¡Vencimiento Hoy!",
          body: testUserId 
            ? "Si ves esto, tus notificaciones están configuradas correctamente." 
            : `Tienes ${deadlines.length} obligación(es) que vencen hoy.`,
          url: "/dashboard/tax-deadlines"
        });

        try {
          console.log(`Sending to subscription ${sub.id}...`);
          await webpush.sendNotification(sub.subscription, payload);
          console.log(`Success for ${sub.id}`);
        } catch (error) {
          console.error(`Error for subscription ${sub.id}:`, error);
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log(`Subscription ${sub.id} is expired, deleting...`);
            await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      });

      await Promise.all(sendPromises);
    }

    return new Response(JSON.stringify({ success: true, notifiedCount: subscriptions?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Global function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
