import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: string;
  organizationId?: string;
  siteId?: string;
  invitationToken: string;
  inviterName: string;
  organizationName?: string;
  siteName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // SECURITY: Check if user has permission to send invitations (admin or site_manager)
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const hasPermission = userRoles?.some(r => 
      r.role === 'system_admin' || r.role === 'site_manager'
    );

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins and site managers can send invitations.' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      email,
      role,
      organizationId,
      siteId,
      invitationToken,
      inviterName,
      organizationName,
      siteName
    }: InvitationRequest = await req.json();

    // SECURITY: Validate inputs
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!['system_admin', 'site_manager', 'field_worker'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending invitation to:", email);

    // Create invitation URL
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "http://localhost:5173";
    const invitationUrl = `${baseUrl}/auth?invitation=${invitationToken}`;

    // Create role display
    const roleDisplay = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Create organization/site context
    let contextText = "";
    if (organizationName && siteName) {
      contextText = ` for ${siteName} (${organizationName})`;
    } else if (organizationName) {
      contextText = ` for ${organizationName}`;
    } else if (siteName) {
      contextText = ` for ${siteName}`;
    }

    // Send email using Resend API directly with fetch
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "WorkOrder System <noreply@resend.dev>",
        to: [email],
        subject: `You've been invited to join WorkOrder System${contextText}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 16px;">
                Welcome to WorkOrder System!
              </h1>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                ${inviterName} has invited you to join WorkOrder System as a <strong>${roleDisplay}</strong>${contextText}.
              </p>
              
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Your Role:</h3>
                <p style="color: #4b5563; margin: 0;">${roleDisplay}</p>
                
                ${organizationName ? `
                  <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 8px; margin-top: 12px;">Organization:</h3>
                  <p style="color: #4b5563; margin: 0;">${organizationName}</p>
                ` : ''}
                
                ${siteName ? `
                  <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 8px; margin-top: 12px;">Site:</h3>
                  <p style="color: #4b5563; margin: 0;">${siteName}</p>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${invitationUrl}" 
                   style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
                This invitation will expire in 7 days. If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              
              <p style="color: #6b7280; font-size: 14px; word-break: break-all; background-color: #f9fafb; padding: 8px; border-radius: 4px;">
                ${invitationUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailResult = await resendResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify(emailResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);