import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const WELCOME_SUBJECT = "Welcome to YOUTENT — Your journey starts here";

function buildWelcomeEmailHtml(fullName: string) {
  const safeName = fullName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to YOUTENT</title></head>
<body style="margin:0;padding:0;background:#eef1fa;font-family:Arial,Helvetica,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef1fa;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;">
<tr><td align="center" style="background:#080b14;padding:24px 20px;"><img src="https://youtent.in/youtent-logo.png.png" alt="YOUTENT — Where Talent Meets Opportunity" width="220" style="display:block;width:220px;max-width:100%;height:auto;border:0;margin:0 auto;"></td></tr>
<tr><td style="padding:38px 32px 36px;">
<p style="margin:0 0 12px;text-align:center;font-size:12px;font-weight:bold;letter-spacing:2px;color:#6545dc;text-transform:uppercase;">Welcome Aboard</p>
<h1 style="margin:0 0 20px;text-align:center;font-size:29px;line-height:1.35;font-weight:800;color:#10172a;">Welcome to YOUTENT!</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.85;color:#536078;">Hi${safeName ? ` ${safeName}` : " there"},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.85;color:#536078;">Your email is verified and your YOUTENT account is ready. We're excited to have you in our growing community where talent meets opportunity.</p>
<p style="margin:0 0 26px;font-size:15px;line-height:1.85;color:#536078;">Discover creative talent, showcase your skills, connect with clients, and turn great ideas into meaningful projects.</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td align="center" bgcolor="#5638dc" style="border-radius:10px;background:#5638dc;"><a href="https://youtent.in/dashboard" style="display:inline-block;padding:16px 34px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;border-radius:10px;">EXPLORE YOUTENT</a></td></tr></table>
<p style="margin:28px 0 0;font-size:14px;line-height:1.8;color:#536078;">We're looking forward to seeing what you'll create.<br><br>Best regards,<br><strong style="color:#18213a;">Team YOUTENT</strong></p>
</td></tr>
<tr><td align="center" style="background:#090d19;padding:26px 20px;"><p style="margin:0 0 10px;font-size:13px;color:#d5dcf2;font-weight:bold;letter-spacing:1px;">WHERE TALENT MEETS OPPORTUNITY</p><a href="https://youtent.in" style="font-size:13px;color:#83aaff;text-decoration:none;">www.youtent.in</a><p style="margin:16px 0 0;font-size:11px;line-height:1.7;color:#929bb1;">© YOUTENT. All rights reserved.<br>This is an automated welcome email.</p></td></tr>
</table></td></tr></table>
</body></html>`;
}

async function sendWelcomeEmailOnce(userId: string, email: string, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Welcome email skipped: RESEND_API_KEY is not configured.");
    return;
  }

  // The unique user_id in auth_welcome_emails is the durable duplicate guard.
  const { error: claimError } = await supabaseAdmin
    .from("auth_welcome_emails")
    .insert({ user_id: userId, email, status: "sending" });

  if (claimError) {
    if (claimError.code === "23505") {
      // This user already had a welcome email attempt; do not send duplicates.
      return;
    }
    console.error("Welcome email claim failed:", claimError.message);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "YOUTENT <no-reply@youtent.in>",
        to: [email],
        subject: WELCOME_SUBJECT,
        html: buildWelcomeEmailHtml(fullName),
      }),
      cache: "no-store",
    });

    const result = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(result.message || result.error || `Resend request failed (${response.status})`);
    }

    await supabaseAdmin
      .from("auth_welcome_emails")
      .update({ status: "sent", resend_id: result.id ?? null, sent_at: new Date().toISOString(), error_message: null })
      .eq("user_id", userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend error";
    await supabaseAdmin
      .from("auth_welcome_emails")
      .update({ status: "failed", error_message: message.slice(0, 1000) })
      .eq("user_id", userId);
    console.error("Welcome email send failed:", message);
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const shouldSendWelcome = requestUrl.searchParams.get("welcome") === "1";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (shouldSendWelcome) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (!userError && user?.id && user.email && user.email_confirmed_at) {
          const fullName =
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : "";
          await sendWelcomeEmailOnce(user.id, user.email, fullName);
        } else if (userError) {
          console.error("Could not load verified user for welcome email:", userError.message);
        }
      }

      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    }

    console.error("Auth callback code exchange error:", error.message);
  }

  return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
}
