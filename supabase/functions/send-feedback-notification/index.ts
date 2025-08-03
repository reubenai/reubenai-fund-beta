import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackNotificationRequest {
  feedbackType: 'bug' | 'feature' | 'general' | 'love';
  rating: number | null;
  message: string;
  userInfo: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  fundInfo?: {
    id: string;
    name: string;
  };
  pageUrl: string;
  userAgent: string;
  metadata: {
    timestamp: string;
    pathname: string;
    referrer: string;
  };
}

const getFeedbackTypeIcon = (type: string): string => {
  switch (type) {
    case 'bug': return '🐛';
    case 'feature': return '💡';
    case 'love': return '❤️';
    default: return '💬';
  }
};

const getFeedbackTypePriority = (type: string): string => {
  switch (type) {
    case 'bug': return '🔴 High Priority';
    case 'feature': return '🟡 Medium Priority';
    case 'love': return '🟢 Low Priority';
    default: return '🟡 Medium Priority';
  }
};

const getRatingStars = (rating: number | null): string => {
  if (!rating) return 'No rating provided';
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating) + ` (${rating}/5)`;
};

const formatEmailHtml = (data: FeedbackNotificationRequest): string => {
  const userName = data.userInfo.firstName && data.userInfo.lastName 
    ? `${data.userInfo.firstName} ${data.userInfo.lastName}`
    : data.userInfo.email;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Feedback from ReubenAI</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">🎯 New Feedback Received</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">ReubenAI User Feedback System</p>
      </div>

      <!-- Feedback Overview -->
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 120px;">Type:</td>
            <td style="padding: 8px 0;">${getFeedbackTypeIcon(data.feedbackType)} ${data.feedbackType.charAt(0).toUpperCase() + data.feedbackType.slice(1)} Report</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Priority:</td>
            <td style="padding: 8px 0;">${getFeedbackTypePriority(data.feedbackType)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Rating:</td>
            <td style="padding: 8px 0;">${getRatingStars(data.rating)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
            <td style="padding: 8px 0;">${new Date(data.metadata.timestamp).toLocaleString('en-US', { 
              timeZone: 'America/New_York',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}</td>
          </tr>
        </table>
      </div>

      <!-- User Information -->
      <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">👤 User Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td>
            <td style="padding: 8px 0;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${data.userInfo.email}" style="color: #007bff; text-decoration: none;">${data.userInfo.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">User ID:</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${data.userInfo.id}</td>
          </tr>
          ${data.fundInfo ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Fund:</td>
            <td style="padding: 8px 0;">${data.fundInfo.name}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Feedback Message -->
      <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">💬 Feedback Message</h3>
        <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; border-radius: 4px; font-size: 16px; line-height: 1.6;">
          ${data.message.replace(/\n/g, '<br>')}
        </div>
      </div>

      <!-- Technical Details -->
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">🔧 Technical Information</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 120px;">Page URL:</td>
            <td style="padding: 6px 0; word-break: break-all;"><a href="${data.pageUrl}" style="color: #007bff; text-decoration: none;">${data.pageUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Page Path:</td>
            <td style="padding: 6px 0;">${data.metadata.pathname}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Referrer:</td>
            <td style="padding: 6px 0;">${data.metadata.referrer || 'Direct visit'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Browser:</td>
            <td style="padding: 6px 0; font-size: 12px;">${data.userAgent}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; padding-top: 20px;">
        <p>This feedback was automatically sent from the ReubenAI feedback system.</p>
        <p>To respond to this user, reply directly to: <a href="mailto:${data.userInfo.email}" style="color: #007bff;">${data.userInfo.email}</a></p>
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
    const data: FeedbackNotificationRequest = await req.json();

    // Validate required fields
    if (!data.message || !data.userInfo?.email || !data.feedbackType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Prepare email subject
    const typeLabel = data.feedbackType.charAt(0).toUpperCase() + data.feedbackType.slice(1);
    const ratingText = data.rating ? ` - ${getRatingStars(data.rating)}` : '';
    const subject = `🎯 New Feedback: ${typeLabel} Report${ratingText}`;

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "ReubenAI Feedback <feedback@goreuben.com>",
      to: ["support@goreuben.com"],
      subject: subject,
      html: formatEmailHtml(data),
    });

    console.log("Feedback notification sent successfully:", {
      emailId: emailResponse.data?.id,
      feedbackType: data.feedbackType,
      userEmail: data.userInfo.email,
      rating: data.rating
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending feedback notification:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send notification", 
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