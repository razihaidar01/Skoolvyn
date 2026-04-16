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

    const { fullName, email, password, phone, institutionCode, roleName, institutionId: directInstId, userId: clientUserId } = body;

    if (!email || !roleName) {
      return new Response(JSON.stringify({ error: "email and roleName are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find institution
    let instId = directInstId;
    if (!instId && institutionCode) {
      const { data: inst } = await supabaseAdmin
        .from("institutions")
        .select("id, approval_status, is_active, name")
        .eq("institution_code", institutionCode.toUpperCase())
        .maybeSingle();

      if (!inst) {
        return new Response(JSON.stringify({ error: "Invalid institution code" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (!inst.is_active || inst.approval_status !== 'approved') {
        return new Response(JSON.stringify({ error: "Institution is not yet approved. Contact your admin." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      instId = inst.id;
    }

    if (!instId) {
      return new Response(JSON.stringify({ error: "Institution not found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Create or find user via admin API (no timeout!)
    let userId = clientUserId;
    if (!userId) {
      if (!password) {
        return new Response(JSON.stringify({ error: "password required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(u => u.email === email);

      if (existing) {
        userId = existing.id;
      } else {
        const nameParts = (fullName || "").split(" ");
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: nameParts[0] || "",
            last_name: nameParts.slice(1).join(" ") || "",
          },
        });
        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        userId = newUser.user?.id;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get role id
    const { data: roleData } = await supabaseAdmin
      .from("roles").select("id").eq("name", roleName).single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: `Role '${roleName}' not found` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Upsert profile
    const nameParts = (fullName || "").split(" ");
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

    // Assign role
    await supabaseAdmin.from("user_roles").upsert({
      user_id: userId,
      role_id: roleData.id,
      institution_id: instId,
    }, { onConflict: 'user_id,role_id,institution_id' });

    // Notify institution admin
    try {
      const { data: adminRole } = await supabaseAdmin.from("roles").select("id").eq("name", "institution_admin").single();
      if (adminRole) {
        const { data: admins } = await supabaseAdmin.from("user_roles")
          .select("user_id").eq("role_id", adminRole.id).eq("institution_id", instId);
        if (admins?.length) {
          await supabaseAdmin.from("notifications").insert(
            admins.map((a: any) => ({
              user_id: a.user_id,
              institution_id: instId,
              title: "New Staff Registration",
              body: `${fullName} has registered as ${roleName.replace(/_/g, ' ')} and is pending approval.`,
              type: "approval",
              sent_at: new Date().toISOString(),
            }))
          );
        }
      }
    } catch (e) { console.error("Notification error (non-fatal):", e); }

    return new Response(JSON.stringify({ success: true, userId, institutionId: instId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
