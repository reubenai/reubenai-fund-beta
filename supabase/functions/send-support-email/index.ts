import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  email: string;
  subject: string;
  description: string;
  priority: string;
  userInfo?: {
    name?: string;
    userId?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Support email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }

  try {
    const requestData: SupportEmailRequest = await req.json();
    console.log("Received support request:", { subject: requestData.subject, priority: requestData.priority });

    const { email, subject, description, priority, userInfo } = requestData;

    // Validate required fields
    if (!email || !subject || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, subject, and description are required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Priority emoji mapping
    const priorityEmoji = {
      low: "🟢",
      medium: "🟡", 
      high: "🔴",
      urgent: "🚨"
    };

    // Send email to support team
    const supportEmailResponse = await resend.emails.send({
      from: "ReubenAI Support <support@goreuben.com>",
      to: ["support@goreuben.com"],
      subject: `${priorityEmoji[priority as keyof typeof priorityEmoji] || "📧"} Support Request: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">New Support Request</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Priority: ${priority.toUpperCase()}</p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">From:</strong> ${email}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Subject:</strong> ${subject}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Priority:</strong> 
              <span style="background: ${priority === 'urgent' ? '#fee2e2' : priority === 'high' ? '#fef3c7' : priority === 'medium' ? '#e0f2fe' : '#ecfdf5'}; 
                           color: ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#d97706' : priority === 'medium' ? '#0369a1' : '#059669'}; 
                           padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                ${priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
            </div>
            
            ${userInfo?.name ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">User:</strong> ${userInfo.name}
            </div>
            ` : ''}
            
            ${userInfo?.userId ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">User ID:</strong> <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${userInfo.userId}</code>
            </div>
            ` : ''}
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <strong style="color: #374151; display: block; margin-bottom: 10px;">Message:</strong>
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; line-height: 1.6; color: #374151;">
              ${description.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280;">
            Sent from ReubenAI Support System • ${new Date().toLocaleString()}
          </div>
        </div>
      `,
    });

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "ReubenAI Support <support@goreuben.com>",
      to: [email],
      subject: "Support Request Received - ReubenAI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold;">R</span>
            </div>
            <h1 style="margin: 0; font-size: 28px;">Thank You!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">We've received your support request</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
            <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 20px;">Your Request Details</h2>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">Subject:</strong> ${subject}
              </div>
              <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">Priority:</strong> 
                <span style="background: ${priority === 'urgent' ? '#fee2e2' : priority === 'high' ? '#fef3c7' : priority === 'medium' ? '#e0f2fe' : '#ecfdf5'}; 
                             color: ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#d97706' : priority === 'medium' ? '#0369a1' : '#059669'}; 
                             padding: 4px 10px; border-radius: 4px; font-size: 14px; font-weight: 500;">
                  ${priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
              </div>
              <div>
                <strong style="color: #374151;">Request ID:</strong> 
                <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px;">#${Date.now().toString().slice(-8)}</code>
              </div>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">⏱️ What Happens Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li style="margin-bottom: 8px;">Our team will review your request within <strong>24 hours</strong></li>
                <li style="margin-bottom: 8px;">We'll investigate and provide a detailed response</li>
                <li>You'll receive updates at <strong>${email}</strong></li>
              </ul>
            </div>
            
            <p style="color: #6b7280; margin: 0; line-height: 1.6;">
              Need urgent assistance? Reply to this email or contact us directly at 
              <a href="mailto:support@goreuben.com" style="color: #059669; text-decoration: none; font-weight: 500;">support@goreuben.com</a>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #059669;">The ReubenAI Support Team</strong>
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
              © ${new Date().getFullYear()} ReubenAI - AI-Powered Investment Platform
            </p>
          </div>
        </div>
      `,
    });

    console.log("Support email sent successfully:", { 
      supportEmailId: supportEmailResponse.data?.id,
      userEmailId: userEmailResponse.data?.id 
    });

    if (supportEmailResponse.error || userEmailResponse.error) {
      console.error("Email sending errors:", {
        supportError: supportEmailResponse.error,
        userError: userEmailResponse.error
      });
      throw new Error("Failed to send one or more emails");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Support request submitted successfully",
        requestId: `#${Date.now().toString().slice(-8)}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send support request", 
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