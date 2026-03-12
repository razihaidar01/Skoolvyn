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
    const { userId, institutionName, institutionType, adminName, email, phone, city, state, address, website } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Insert institution
    const { data: inst, error: instError } = await supabaseAdmin
      .from("institutions")
      .insert({
        name: institutionName,
        type: institutionType,
        email,
        phone,
        city,
        state,
        address,
        website,
        approval_status: "pending",
        is_active: false,
        registered_by: userId,
        contact_person: adminName,
      })
      .select("id, institution_code")
      .single();

    if (instError) {
      console.error("Institution insert error:", instError);
      return new Response(JSON.stringify({ error: instError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Insert/update profile
    const nameParts = adminName.split(" ");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" ") || null,
        email,
        phone,
        institution_id: inst.id,
        approval_status: "pending",
        is_active: false,
      });

    if (profileError) {
      console.error("Profile insert error:", profileError);
    }

    // 3. Get institution_admin role id
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "institution_admin")
      .single();

    if (roleData) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role_id: roleData.id,
        institution_id: inst.id,
      });
    }

    // 4. Log the registration
    await supabaseAdmin.from("approval_logs").insert({
      action: "institution_registered",
      target_type: "institution",
      target_user_id: userId,
      institution_id: inst.id,
    });

    // 5. Notify super admin (best effort)
    try {
      const { data: superAdmins } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("role", "super_admin");

      if (superAdmins?.length) {
        const notifications = superAdmins.map((sa: any) => ({
          user_id: sa.id,
          title: "New Institution Registration",
          body: `${institutionName} has registered and is pending approval.`,
          type: "approval",
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    } catch { /* best effort */ }

    return new Response(JSON.stringify({ success: true, institutionCode: inst.institution_code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
