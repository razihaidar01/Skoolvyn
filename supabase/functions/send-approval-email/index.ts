const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const templates: Record<string, (d: any) => { subject: string; html: string }> = {
  institution_approved: (d) => ({
    subject: "🎉 Your Institution is Approved — Welcome to Skoolvyn!",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px 0;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <h1 style="color:#1a56db;font-size:24px;margin:0 0 8px;">Skoolvyn</h1>
  <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">Digital System for Modern Schools</p>
  <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">🎉 Congratulations, ${d.recipient_name}!</h2>
  <p style="color:#374151;font-size:15px;line-height:1.6;">
    Your institution <strong>${d.institution_name || ''}</strong> has been approved and is now active on Skoolvyn.
  </p>
  <h3 style="color:#111827;font-size:16px;margin:20px 0 8px;">Getting Started:</h3>
  <ol style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;">
    <li>Log in to your admin dashboard</li>
    <li>Set up departments and programs</li>
    <li>Add staff and faculty members</li>
    <li>Start enrolling students</li>
  </ol>
  <a href="${d.dashboard_url || 'https://skoolvyn.vercel.app/login'}" style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;margin:24px 0;">
    Go to Dashboard
  </a>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Skoolvyn. All rights reserved.</p>
</div></body></html>`,
  }),
  institution_rejected: (d) => ({
    subject: "Skoolvyn Registration Update",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px 0;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <h1 style="color:#1a56db;font-size:24px;margin:0 0 8px;">Skoolvyn</h1>
  <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">Digital System for Modern Schools</p>
  <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Registration Update</h2>
  <p style="color:#374151;font-size:15px;line-height:1.6;">
    Dear ${d.recipient_name}, we regret to inform you that your institution registration was not approved at this time.
  </p>
  ${d.rejection_reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:16px 0;"><strong style="color:#991b1b;font-size:14px;">Reason:</strong><p style="color:#991b1b;font-size:14px;margin:4px 0 0;">${d.rejection_reason}</p></div>` : ''}
  <p style="color:#374151;font-size:15px;line-height:1.6;">
    If you believe this was in error, please contact us at <a href="mailto:support@skoolvyn.in" style="color:#1a56db;">support@skoolvyn.in</a>.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Skoolvyn. All rights reserved.</p>
</div></body></html>`,
  }),
  staff_approved: (d) => ({
    subject: "✅ Your Skoolvyn Account is Approved!",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px 0;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <h1 style="color:#1a56db;font-size:24px;margin:0 0 8px;">Skoolvyn</h1>
  <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">Digital System for Modern Schools</p>
  <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Welcome, ${d.recipient_name}! ✅</h2>
  <p style="color:#374151;font-size:15px;line-height:1.6;">
    Your account has been approved. You can now log in and access your dashboard.
  </p>
  <a href="${d.dashboard_url || 'https://skoolvyn.vercel.app/login'}" style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;margin:24px 0;">
    Log in Now
  </a>
  <p style="color:#6b7280;font-size:13px;">Need help? <a href="mailto:support@skoolvyn.in" style="color:#1a56db;">support@skoolvyn.in</a></p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Skoolvyn. All rights reserved.</p>
</div></body></html>`,
  }),
  staff_rejected: (d) => ({
    subject: "Skoolvyn Account Update",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px 0;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <h1 style="color:#1a56db;font-size:24px;margin:0 0 8px;">Skoolvyn</h1>
  <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Account Update</h2>
  <p style="color:#374151;font-size:15px;line-height:1.6;">
    Dear ${d.recipient_name}, your account registration was not approved.
  </p>
  ${d.rejection_reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:16px 0;"><strong style="color:#991b1b;font-size:14px;">Reason:</strong><p style="color:#991b1b;font-size:14px;margin:4px 0 0;">${d.rejection_reason}</p></div>` : ''}
  <p style="color:#374151;font-size:15px;">Contact your institution administrator or <a href="mailto:support@skoolvyn.in" style="color:#1a56db;">support@skoolvyn.in</a>.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Skoolvyn. All rights reserved.</p>
</div></body></html>`,
  }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, recipient_email } = body;

    if (!type || !recipient_email) {
      return new Response(JSON.stringify({ error: "type and recipient_email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateFn = templates[type];
    if (!templateFn) {
      return new Response(JSON.stringify({ error: "Invalid email type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = templateFn(body);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "Skoolvyn <onboarding@resend.dev>",
        to: [recipient_email],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await resendRes.json();
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
