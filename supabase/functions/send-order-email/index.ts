import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Logo URL from public storage bucket
const LOGO_LIGHT_URL = `${SUPABASE_URL}/storage/v1/object/public/email-assets/logo-light.png`;

const APP_URL = "https://id-preview--64b0f4ed-74b7-4732-a5b5-2f49396910fb.lovable.app";
const FROM_EMAIL = "noreply@resend.dev"; // Change to custom domain when ready

type EmailType = "order_confirmation" | "status_update" | "quote_sent" | "urgent_alert";

interface EmailRequest {
  type: EmailType;
  work_order_id: string;
  extra?: Record<string, unknown>;
}

// ─── HTML Template Builder ───

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="no">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#333333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background-color:#292C3F;padding:24px 32px;text-align:center;">
<img src="${LOGO_LIGHT_URL}" alt="ASCO" height="40" style="height:40px;max-height:40px;" />
</td></tr>

<!-- Body -->
<tr><td style="padding:32px;background-color:#ffffff;">
${body}
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f5f5f5;padding:20px 32px;text-align:center;font-size:12px;color:#8F8C90;line-height:1.5;">
ASCO — Ditt partnerfirma<br/>
Ikke svar på denne e-posten.<br/>
Ved spørsmål, kontakt oss direkte.
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background-color:#00FDC7;border-radius:8px;padding:14px 28px;text-align:center;">
<a href="${url}" style="color:#292C3F;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">${text}</a>
</td></tr></table>`;
}

function orderUrl(id: string): string {
  return `${APP_URL}/work-orders?order=${id}`;
}

// ─── Template Functions ───

function orderConfirmation(order: any, customer: any): { subject: string; html: string } {
  const subject = `Ordrebekreftelse — ${order.title}`;
  const html = baseLayout(subject, `
    <h2 style="margin:0 0 16px;color:#292C3F;font-size:20px;">Ny ordre registrert</h2>
    <p style="margin:0 0 8px;"><strong>Ordre:</strong> ${order.title}</p>
    ${order.description ? `<p style="margin:0 0 8px;"><strong>Beskrivelse:</strong> ${order.description}</p>` : ""}
    ${order.notes ? `<p style="margin:0 0 8px;"><strong>Notater:</strong> ${order.notes}</p>` : ""}
    <p style="margin:0 0 8px;"><strong>Status:</strong> ${statusLabel(order.status)}</p>
    <p style="margin:16px 0 0;color:#8F8C90;font-size:13px;">Vi tar kontakt ved behov for oppfølging.</p>
    ${ctaButton("Se ordre i portalen", orderUrl(order.id))}
  `);
  return { subject, html };
}

function statusUpdate(order: any, customer: any, newStatus: string): { subject: string; html: string } {
  const subject = `Statusoppdatering — ${order.title}`;
  const html = baseLayout(subject, `
    <h2 style="margin:0 0 16px;color:#292C3F;font-size:20px;">Ordrestatus oppdatert</h2>
    <p style="margin:0 0 8px;"><strong>Ordre:</strong> ${order.title}</p>
    <p style="margin:0 0 8px;"><strong>Ny status:</strong> ${statusLabel(newStatus)}</p>
    ${newStatus === "in_progress" ? `<p style="margin:0 0 8px;">Arbeidet er nå i gang.</p>` : ""}
    ${newStatus === "completed" ? `<p style="margin:0 0 8px;">Arbeidet er fullført.</p>` : ""}
    ${ctaButton("Se ordre i portalen", orderUrl(order.id))}
  `);
  return { subject, html };
}

function quoteSent(order: any, customer: any, quoteAmount: number): { subject: string; html: string } {
  const subject = `Pristilbud — ${order.title}`;
  const formatted = new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(quoteAmount);
  const html = baseLayout(subject, `
    <h2 style="margin:0 0 16px;color:#292C3F;font-size:20px;">Pristilbud mottatt</h2>
    <p style="margin:0 0 8px;"><strong>Ordre:</strong> ${order.title}</p>
    ${order.description ? `<p style="margin:0 0 8px;"><strong>Beskrivelse:</strong> ${order.description}</p>` : ""}
    <p style="margin:0 0 8px;font-size:24px;font-weight:bold;color:#292C3F;">${formatted}</p>
    <p style="margin:0 0 8px;color:#8F8C90;font-size:13px;">Logg inn i portalen for å godkjenne eller avslå tilbudet.</p>
    ${ctaButton("Se tilbud i portalen", orderUrl(order.id))}
  `);
  return { subject, html };
}

function urgentAlert(order: any, customer: any): { subject: string; html: string } {
  const subject = `🔴 HASTEORDRE — ${order.title}`;
  const gpsLink = order.gps_location
    ? `https://www.google.com/maps?q=${order.gps_location.y},${order.gps_location.x}`
    : null;
  const html = baseLayout(subject, `
    <h2 style="margin:0 0 16px;color:#dc2626;font-size:20px;">⚠️ Hasteordre registrert</h2>
    <p style="margin:0 0 8px;"><strong>Kunde:</strong> ${customer.name}</p>
    <p style="margin:0 0 8px;"><strong>Ordre:</strong> ${order.title}</p>
    ${order.description ? `<p style="margin:0 0 8px;"><strong>Beskrivelse:</strong> ${order.description}</p>` : ""}
    ${gpsLink ? `<p style="margin:0 0 8px;"><strong>Lokasjon:</strong> <a href="${gpsLink}" style="color:#00FDC7;">Vis på kart</a></p>` : ""}
    <p style="margin:16px 0 0;color:#8F8C90;font-size:13px;">Denne ordren er merket som haster og krever umiddelbar oppmerksomhet.</p>
    ${ctaButton("Se ordre i portalen", orderUrl(order.id))}
  `);
  return { subject, html };
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Ny",
    in_progress: "Pågår",
    completed: "Fullført",
    cancelled: "Kansellert",
    draft: "Kladd",
  };
  return map[status] || status;
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, work_order_id, extra } = (await req.json()) as EmailRequest;

    if (!type || !work_order_id) {
      return new Response(JSON.stringify({ error: "Missing type or work_order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for DB access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Duplicate check: same order + type within 5 min
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("email_log")
      .select("id")
      .eq("work_order_id", work_order_id)
      .eq("email_type", type)
      .gte("created_at", fiveMinAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Duplicate skipped" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order + customer
    const { data: order, error: orderErr } = await supabase
      .from("work_orders")
      .select("*, customers(*)")
      .eq("id", work_order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customer = order.customers;
    if (!customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recipientEmail: string;
    let recipientName: string | null;
    let emailContent: { subject: string; html: string };

    switch (type) {
      case "order_confirmation": {
        if (!customer.email) {
          return new Response(JSON.stringify({ error: "Customer has no email" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        recipientEmail = customer.email;
        recipientName = customer.contact_person || customer.name;
        emailContent = orderConfirmation(order, customer);
        break;
      }
      case "status_update": {
        if (!customer.email) {
          return new Response(JSON.stringify({ error: "Customer has no email" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        recipientEmail = customer.email;
        recipientName = customer.contact_person || customer.name;
        emailContent = statusUpdate(order, customer, (extra?.new_status as string) || order.status);
        break;
      }
      case "quote_sent": {
        if (!customer.email) {
          return new Response(JSON.stringify({ error: "Customer has no email" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        recipientEmail = customer.email;
        recipientName = customer.contact_person || customer.name;
        emailContent = quoteSent(order, customer, (extra?.quote_amount as number) || 0);
        break;
      }
      case "urgent_alert": {
        // Send to dispatchers (site managers) for this site
        const siteId = order.site_id;
        let dispatcherEmails: string[] = [];

        if (siteId) {
          // Get profiles of site managers for this site
          const { data: managers } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .eq("site_id", siteId)
            .eq("role", "site_manager");

          if (managers && managers.length > 0) {
            // Get auth emails for these users
            for (const m of managers) {
              const { data: userData } = await supabase.auth.admin.getUserById(m.user_id);
              if (userData?.user?.email) {
                dispatcherEmails.push(userData.user.email);
              }
            }
          }
        }

        // Fallback: get all system_admins
        if (dispatcherEmails.length === 0) {
          const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "system_admin");

          if (adminRoles) {
            for (const ar of adminRoles) {
              const { data: userData } = await supabase.auth.admin.getUserById(ar.user_id);
              if (userData?.user?.email) {
                dispatcherEmails.push(userData.user.email);
              }
            }
          }
        }

        if (dispatcherEmails.length === 0) {
          return new Response(JSON.stringify({ error: "No dispatchers found" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        recipientEmail = dispatcherEmails[0];
        recipientName = "Disponent";
        emailContent = urgentAlert(order, customer);

        // Send to all dispatchers
        for (const email of dispatcherEmails) {
          await sendViaResend(email, emailContent.subject, emailContent.html);
        }

        // Log
        await supabase.from("email_log").insert({
          work_order_id,
          email_type: type,
          recipient_email: dispatcherEmails.join(", "),
          recipient_name: "Disponenter",
          subject: emailContent.subject,
          status: "sent",
          sent_at: new Date().toISOString(),
          metadata: { dispatcher_count: dispatcherEmails.length },
        });

        return new Response(JSON.stringify({ success: true, sent_to: dispatcherEmails.length }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid email type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Send email via Resend
    const resendOk = await sendViaResend(recipientEmail, emailContent.subject, emailContent.html);

    // Log
    await supabase.from("email_log").insert({
      work_order_id,
      email_type: type,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject: emailContent.subject,
      status: resendOk ? "sent" : "failed",
      sent_at: resendOk ? new Date().toISOString() : null,
      error_message: resendOk ? null : "Resend API error",
    });

    return new Response(JSON.stringify({ success: resendOk }), {
      status: resendOk ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-order-email error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend error:", errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend fetch error:", err);
    return false;
  }
}
