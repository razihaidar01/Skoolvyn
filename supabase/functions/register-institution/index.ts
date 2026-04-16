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
    let body: any;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return new Response(JSON.stringify({ error: "Empty request body" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      body = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const {
      institutionName, institutionType, adminName, email, password,
      phone, city, state, address, website,
      // Legacy: userId passed from client (if client already created user)
      userId: clientUserId,
    } = body;

    if (!institutionName || !email) {
      return new Response(JSON.stringify({ error: "institutionName and email are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId = clientUserId;

    // If no userId provided (new flow), create user server-side using service role
    // This avoids client-side auth.signUp timeouts completely
    if (!userId) {
      if (!password) {
        return new Response(JSON.stringify({ error: "password is required for new registration" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(u => u.email === email);
      
      if (existing) {
        userId = existing.id;
      } else {
        // Create user via admin API (no timeout issues!)
        const nameParts = (adminName || "").split(" ");
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // auto-confirm
          user_metadata: {
            first_name: nameParts[0] || "",
            last_name: nameParts.slice(1).join(" ") || "",
          },
        });

        if (createError) {
          console.error("Create user error:", createError);
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        userId = newUser.user?.id;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Failed to get or create user" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check if institution already registered by this user
    const { data: existingInst } = await supabaseAdmin
      .from("institutions")
      .select("id, institution_code")
      .eq("registered_by", userId)
      .maybeSingle();

    let instId: string;
    let instCode: string;

    if (existingInst) {
      instId = existingInst.id;
      instCode = existingInst.institution_code;
    } else {
      // Generate institution code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

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
          institution_code: code,
          approval_status: "pending",
          is_active: false,
          registered_by: userId,
          contact_person: adminName || null,
        })
        .select("id, institution_code")
        .single();

      if (instError) {
        console.error("Institution insert error:", instError);
        return new Response(JSON.stringify({ error: instError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      instId = inst.id;
      instCode = inst.institution_code;
    }

    // Upsert profile
    const nameParts = (adminName || "").split(" ");
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || null,
      email,
      phone: phone || null,
      institution_id: instId,
      approval_status: "pending",
      is_active: false,
    });

    // Assign institution_admin role
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "institution_admin")
      .single();

    if (roleData) {
      await supabaseAdmin.from("user_roles").upsert({
        user_id: userId,
        role_id: roleData.id,
        institution_id: instId,
      }, { onConflict: 'user_id,role_id,institution_id' });
    }

    // Notify super admins
    try {
      const { data: superRoleData } = await supabaseAdmin
        .from("roles").select("id").eq("name", "super_admin").single();
      if (superRoleData) {
        const { data: superAdmins } = await supabaseAdmin
          .from("user_roles").select("user_id").eq("role_id", superRoleData.id);
        if (superAdmins?.length) {
          await supabaseAdmin.from("notifications").insert(
            superAdmins.map((sa: any) => ({
              user_id: sa.user_id,
              institution_id: instId,
              title: "New Institution Registration",
              body: `${institutionName} has registered and is pending approval.`,
              type: "approval",
              sent_at: new Date().toISOString(),
            }))
          );
        }
      }
    } catch (e) { console.error("Notification error (non-fatal):", e); }

    // Send email
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Skoolvyn <onboarding@resend.dev>",
            to: ["razihaidar9342@gmail.com"],
            subject: `New Registration: ${institutionName}`,
            html: `<h2>New Institution Registration</h2><p><strong>${institutionName}</strong> has registered and is pending approval.</p><ul><li>Admin: ${adminName}</li><li>Email: ${email}</li><li>City: ${city}, ${state}</li></ul><p><a href="https://skoolvyn.vercel.app/super-admin/approvals">Approve now</a></p>`,
          }),
        });
      }
    } catch (e) { console.error("Email error (non-fatal):", e); }

    return new Response(JSON.stringify({
      success: true,
      institutionCode: instCode,
      institutionId: instId,
      userId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Internal server error"
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
