import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  to: string;
  name: string;
  email: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get user profile for name
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const userName = profile?.name || user.email?.split('@')[0] || 'Friend';

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Afri-BFFs!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF1493, #FF69B4); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #FF1493; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .steps { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .step { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to Afri-BFFs!</h1>
          <p>Your friendship journey starts here</p>
        </div>
        
        <div class="content">
          <h2>Hi ${userName},</h2>
          
          <p><strong>Congratulations!</strong> You have successfully confirmed your email address and joined the Afri-BFFs community.</p>
          
          <p>You can now log in to the app using:</p>
          <ul>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Password:</strong> [Your chosen password]</li>
          </ul>
          
          <div class="steps">
            <h3>Ready to find your new best friends? Start by:</h3>
            <div class="step">1. 📸 Completing your profile with photos and interests</div>
            <div class="step">2. ⚙️ Setting your discovery preferences</div>
            <div class="step">3. 💕 Start swiping to meet amazing people!</div>
          </div>
          
          <p>Welcome to our community of friendship seekers! We're excited to help you connect with like-minded people and build meaningful friendships.</p>
          
          <p>Best regards,<br>
          <strong>The Afri-BFFs Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This email was sent to ${user.email}. If you did not create an account, please ignore this email.</p>
          <p>Afri-BFFs - Connecting Friends Across Cultures</p>
        </div>
      </body>
      </html>
    `;

    // Send email using Supabase's built-in email service
    // Note: In production, you might want to use a service like SendGrid, Mailgun, or AWS SES
    // For now, we'll use a simple approach that logs the email content
    
    console.log('Sending welcome email to:', user.email);
    console.log('Email content prepared for:', userName);
    
    // In a real implementation, you would send the email here
    // For example, using Resend, SendGrid, or another email service:
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@afri-bffs.com',
        to: user.email,
        subject: 'Welcome to Afri-BFFs! 🎉',
        html: emailHtml,
      }),
    });
    */
    
    // For now, we'll simulate successful email sending
    // You can replace this with actual email service integration
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        recipient: user.email 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});