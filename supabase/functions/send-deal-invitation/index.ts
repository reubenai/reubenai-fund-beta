import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DealInvitationRequest {
  recipientEmail: string;
  recipientName?: string;
  role: 'viewer' | 'commenter' | 'note_creator';
  dealInfo: {
    id: string;
    companyName: string;
    fundName: string;
  };
  inviterInfo: {
    name: string;
    email: string;
  };
  isNewUser: boolean;
  invitationToken?: string;
  accessType: 'internal' | 'external';
}

const getRoleDescription = (role: string): string => {
  switch (role) {
    case 'viewer':
      return 'View deal details, documents, and analysis reports';
    case 'commenter':
      return 'View and comment on deal activities and discussions';
    case 'note_creator':
      return 'View, comment, and create notes and analysis';
    default:
      return 'View deal information';
  }
};

const getRoleIcon = (role: string): string => {
  switch (role) {
    case 'viewer': return '👁️';
    case 'commenter': return '💬';
    case 'note_creator': return '📝';
    default: return '👤';
  }
};

const formatInvitationEmailHtml = (data: DealInvitationRequest): string => {
  const actionUrl = data.isNewUser 
    ? `${Deno.env.get('SITE_URL') || 'https://app.reubenai.com'}/auth?invitation=${data.invitationToken}&deal=${data.dealInfo.id}`
    : `${Deno.env.get('SITE_URL') || 'https://app.reubenai.com'}/deals?deal=${data.dealInfo.id}`;

  const actionText = data.isNewUser ? 'Sign Up & Access Deal' : 'View Deal';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Deal Access Invitation - ${data.dealInfo.companyName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🤝 Deal Access Invitation</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">You've been invited to collaborate</p>
      </div>

      <!-- Invitation Details -->
      <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 24px;">🎯 ${data.dealInfo.companyName}</h2>
        
        <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0 0 10px 0; font-size: 16px; color: #2c3e50;">
            <strong>${data.inviterInfo.name}</strong> has invited you to collaborate on the 
            <strong>${data.dealInfo.companyName}</strong> deal in the <strong>${data.dealInfo.fundName}</strong> fund.
          </p>
        </div>

        <!-- Access Level -->
        <div style="background: #e8f4fd; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #1565c0; font-size: 18px;">
            ${getRoleIcon(data.role)} Your Access Level: ${data.role.charAt(0).toUpperCase() + data.role.slice(1)}
          </h3>
          <p style="margin: 0; color: #1565c0; font-size: 15px;">
            ${getRoleDescription(data.role)}
          </p>
        </div>

        <!-- Call to Action -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: transform 0.2s;">
            ${actionText} →
          </a>
        </div>

        ${data.isNewUser ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>New to ReubenAI?</strong> The link above will guide you through account creation and then directly to the deal.
          </p>
        </div>
        ` : `
        <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="margin: 0; color: #0c5460; font-size: 14px;">
            <strong>Returning user?</strong> Simply log in to your existing account to access the deal.
          </p>
        </div>
        `}
      </div>

      <!-- Deal Information -->
      <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 20px 0; color: #2c3e50; border-bottom: 2px solid #f1f2f6; padding-bottom: 10px;">📊 Deal Information</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; font-weight: 600; width: 130px; color: #666;">Company:</td>
            <td style="padding: 12px 0; color: #2c3e50; font-size: 16px;">${data.dealInfo.companyName}</td>
          </tr>
          <tr style="border-top: 1px solid #f1f2f6;">
            <td style="padding: 12px 0; font-weight: 600; color: #666;">Fund:</td>
            <td style="padding: 12px 0; color: #2c3e50;">${data.dealInfo.fundName}</td>
          </tr>
          <tr style="border-top: 1px solid #f1f2f6;">
            <td style="padding: 12px 0; font-weight: 600; color: #666;">Invited by:</td>
            <td style="padding: 12px 0; color: #2c3e50;">${data.inviterInfo.name} (${data.inviterInfo.email})</td>
          </tr>
          <tr style="border-top: 1px solid #f1f2f6;">
            <td style="padding: 12px 0; font-weight: 600; color: #666;">Access Type:</td>
            <td style="padding: 12px 0; color: #2c3e50;">${data.accessType === 'internal' ? 'Team Member' : 'External Collaborator'}</td>
          </tr>
        </table>
      </div>

      <!-- Security Notice -->
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #495057;">🔒 Security & Privacy</h4>
        <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 14px;">
          <li>Your access is limited to the specific role granted</li>
          <li>All activities are logged for audit purposes</li>
          <li>You can only access the deals you've been explicitly invited to</li>
          <li>Contact ${data.inviterInfo.email} if you have questions about this invitation</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; padding-top: 20px;">
        <p style="margin: 0 0 10px 0;">This invitation was sent via ReubenAI's secure deal collaboration platform.</p>
        <p style="margin: 0;">
          Need help? Contact support at 
          <a href="mailto:support@goreuben.com" style="color: #667eea; text-decoration: none;">support@goreuben.com</a>
        </p>
      </div>

    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const data: DealInvitationRequest = await req.json();

    // Validate required fields
    if (!data.recipientEmail || !data.role || !data.dealInfo?.companyName || !data.inviterInfo?.name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Prepare email subject
    const subject = data.isNewUser 
      ? `Invitation: Access ${data.dealInfo.companyName} deal on ReubenAI`
      : `New Access: ${data.dealInfo.companyName} deal shared with you`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "ReubenAI Deals <deals@goreuben.com>",
      to: [data.recipientEmail],
      subject: subject,
      html: formatInvitationEmailHtml(data),
    });

    console.log("Deal invitation sent successfully:", {
      emailId: emailResponse.data?.id,
      recipientEmail: data.recipientEmail,
      dealId: data.dealInfo.id,
      role: data.role,
      isNewUser: data.isNewUser
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: `Invitation sent to ${data.recipientEmail}`
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending deal invitation:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send invitation", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);