import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Roles that can be self-assigned during registration
const ALLOWED_REGISTRATION_ROLES = [
  "faculty", "accountant", "librarian", "hostel_warden",
  "transport_manager", "hr_manager", "lab_assistant",
  "office_staff", "counselor",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Safe JSON parsing
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return new Response(
          JSON.stringify({ error: "Empty request body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      body = JSON.parse(text);
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, fullName, email, phone, institutionId, roleName } = body;

    // Validate required fields
    if (!userId || !fullName || !email || !institutionId || !roleName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Reject privileged roles — prevent self-escalation
    if (!ALLOWED_REGISTRATION_ROLES.includes(roleName)) {
      return new Response(
        JSON.stringify({ error: `Role '${roleName}' cannot be self-assigned during registration` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate JWT: ensure the caller is the user being registered
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callerUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure the caller is registering themselves, not someone else
    if (callerUser.id !== userId) {
      return new Response(
        JSON.stringify({ error: "You can only register your own account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || null,
        email,
        phone: phone || null,
        institution_id: institutionId,
        approval_status: "pending",
        is_active: false,
      });

    if (profileError) {
      console.error("Profile insert error:", profileError);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get role id and insert user_role
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .single();

    if (roleData) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          role_id: roleData.id,
          institution_id: institutionId,
        });
      if (roleError) console.error("Role insert error:", roleError);
    }

    // 2b. Persist auth metadata for fallback routing after registration
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || null,
        role: roleName,
        institution_id: institutionId,
      },
    });

    if (metadataError) {
      console.error("Metadata update error:", metadataError);
    }

    // 3. Log (use valid enum action)
    try {
      await supabaseAdmin.from("approval_logs").insert({
        action: "approved",
        target_type: "staff",
        target_user_id: userId,
        institution_id: institutionId,
        reason: `New staff registration as ${roleName} - pending approval`,
      });
    } catch (logErr) {
      console.error("Log error:", logErr);
    }

    // 4. Notify institution admin (best effort)
    try {
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("institution_id", institutionId)
        .eq("role_id", (
          await supabaseAdmin
            .from("roles")
            .select("id")
            .eq("name", "institution_admin")
            .single()
        ).data?.id);

      if (adminRoles?.length) {
        const notifications = adminRoles.map((a: any) => ({
          user_id: a.user_id,
          title: "New Staff Registration",
          body: `${fullName} has registered as ${roleName.replace(/_/g, ' ')} and is pending approval.`,
          type: "approval",
          institution_id: institutionId,
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    } catch (notifErr) {
      console.error("Notification error (non-fatal):", notifErr);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
