import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, fullName, email, phone, institutionId, roleName } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const nameParts = fullName.split(" ");

    // 1. Insert/update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" ") || null,
        email,
        phone,
        institution_id: institutionId,
        approval_status: "pending",
        is_active: false,
      });

    if (profileError) {
      console.error("Profile insert error:", profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get role id
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .single();

    if (roleData) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role_id: roleData.id,
        institution_id: institutionId,
      });
    }

    // 3. Log
    await supabaseAdmin.from("approval_logs").insert({
      action: "staff_registered",
      target_type: "staff",
      target_user_id: userId,
      institution_id: institutionId,
    });

    // 4. Notify institution admin (best effort)
    try {
      const { data: admins } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("institution_id", institutionId)
        .eq("role", "institution_admin");

      if (admins?.length) {
        const notifications = admins.map((a: any) => ({
          user_id: a.id,
          title: "New Staff Registration",
          body: `${fullName} has registered as ${roleName.replace(/_/g, ' ')} and is pending approval.`,
          type: "approval",
          institution_id: institutionId,
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    } catch { /* best effort */ }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
