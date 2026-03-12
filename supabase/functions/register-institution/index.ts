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
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, institutionName, institutionType, adminName, email, phone, city, state, address, website } = body;

    // Validate required fields
    if (!userId || !institutionName || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, institutionName, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Insert institution
    const { data: inst, error: instError } = await supabaseAdmin
      .from("institutions")
      .insert({
        name: institutionName,
        type: institutionType || "school",
        email,
        phone: phone || null,
        city: city || null,
        state: state || null,
        address: address || null,
        website: website || null,
        approval_status: "pending",
        is_active: false,
        registered_by: userId,
        contact_person: adminName,
      })
      .select("id, institution_code")
      .single();

    if (instError) {
      console.error("Institution insert error:", instError);
      return new Response(
        JSON.stringify({ error: instError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Insert/update profile
    const nameParts = (adminName || "").split(" ");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || null,
        email,
        phone: phone || null,
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
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          role_id: roleData.id,
          institution_id: inst.id,
        });
      if (roleError) console.error("Role insert error:", roleError);
    }

    // 4. Log the registration
    try {
      await supabaseAdmin.from("approval_logs").insert({
        action: "approved", // using valid enum value for log
        target_type: "institution",
        target_user_id: userId,
        institution_id: inst.id,
        reason: "New institution registration - pending approval",
      });
    } catch (logErr) {
      console.error("Log error:", logErr);
    }

    // 5. Notify super admins via notifications table
    try {
      const { data: superAdminProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("approval_status", "approved");

      const { data: superAdminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role_id", (
          await supabaseAdmin
            .from("roles")
            .select("id")
            .eq("name", "super_admin")
            .single()
        ).data?.id);

      if (superAdminRoles?.length) {
        const notifications = superAdminRoles.map((sa: any) => ({
          recipient_id: sa.user_id,
          institution_id: inst.id,
          title: "New Institution Registration",
          body: `${institutionName} has registered and is pending approval.`,
          type: "approval",
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    } catch (notifErr) {
      console.error("Notification error (non-fatal):", notifErr);
    }

    // 6. Send email to super admin via Resend
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Skoolvyn <onboarding@resend.dev>",
            to: ["razihaidar9342@gmail.com"],
            subject: `New Institution Registration: ${institutionName}`,
            html: `
              <h2>New Institution Registration</h2>
              <p><strong>${institutionName}</strong> has registered on Skoolvyn and is pending your approval.</p>
              <ul>
                <li><strong>Type:</strong> ${institutionType}</li>
                <li><strong>Admin:</strong> ${adminName}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>City:</strong> ${city}, ${state}</li>
              </ul>
              <p><a href="https://skoolvyn.vercel.app/super-admin/dashboard">Login to approve</a></p>
            `,
          }),
        });
      }
    } catch (emailErr) {
      console.error("Email error (non-fatal):", emailErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        institutionCode: inst.institution_code,
        institutionId: inst.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
