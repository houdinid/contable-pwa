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

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Parse body for test mode
  let testUserId = null;
  try {
    const body = await req.json();
    testUserId = body.testUserId;
  } catch (e) { /* ignore parse errors for empty bodies */ }

  const today = new Date().toISOString().split("T")[0];
  
  // 1. Get deadlines
  const { data: deadlines, error: dlError } = await supabaseClient
    .from("tax_deadlines")
    .select("*")
    .eq("expiration_date", today)
    .eq("completed", false);

  if (dlError) throw dlError;

  // 2. Get subscriptions (filtered if testing)
  let query = supabaseClient.from("push_subscriptions").select("*");
  if (testUserId) {
    query = query.eq("user_id", testUserId);
  }
  
  const { data: subscriptions, error: subError } = await query;
  if (subError) throw subError;

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
        await webpush.sendNotification(sub.subscription, payload);
      } catch (error) {
        console.error("Error enviando notificación:", error);
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    });

    await Promise.all(sendPromises);
  }

  return new Response(JSON.stringify({ success: true, notifiedCount: subscriptions?.length || 0 }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
