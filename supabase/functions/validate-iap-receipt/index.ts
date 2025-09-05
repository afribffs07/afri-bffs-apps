import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppleReceiptData {
  receipt_data: string;
  password?: string;
}

interface GoogleReceiptData {
  packageName: string;
  productId: string;
  purchaseToken: string;
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

    const { platform, productId, purchaseToken, receipt, transactionId } = await req.json();
    console.log('Validating receipt for user:', user.id, 'platform:', platform);

    let validationResult = false;
    let subscriptionEnd = null;

    if (platform === 'ios') {
      // Validate Apple receipt
      validationResult = await validateAppleReceipt(receipt, productId);
    } else if (platform === 'android') {
      // Validate Google Play receipt  
      validationResult = await validateGoogleReceipt(purchaseToken, productId);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!validationResult) {
      throw new Error('Receipt validation failed');
    }

    // Calculate subscription end date (30 days from now for monthly subscription)
    subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    // Update user subscription status
    await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: user.id,
        email: user.email!,
        subscribed: true,
        subscription_tier: 'Premium',
        subscription_end: subscriptionEnd.toISOString(),
        platform_transaction_id: transactionId || purchaseToken,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Also update user_profiles is_premium status
    await supabaseClient
      .from('user_profiles')
      .update({ is_premium: true })
      .eq('id', user.id);

    console.log('Subscription activated for user:', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        subscription_tier: 'Premium',
        subscription_end: subscriptionEnd.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating receipt:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function validateAppleReceipt(receiptData: string, productId: string): Promise<boolean> {
  try {
    // Use Apple's sandbox URL for development, production URL for release
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
    const verifyUrl = isProduction 
      ? 'https://buy.itunes.apple.com/verifyReceipt'
      : 'https://sandbox.itunes.apple.com/verifyReceipt';

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': Deno.env.get('APPLE_SHARED_SECRET'), // Set this in Supabase secrets
        'exclude-old-transactions': false
      }),
    });

    const result = await response.json();
    console.log('Apple receipt validation result:', result);

    // Check if receipt is valid and contains the expected product
    if (result.status === 0) {
      const receipts = result.receipt?.in_app || [];
      return receipts.some((item: any) => item.product_id === productId);
    }

    return false;
  } catch (error) {
    console.error('Apple receipt validation error:', error);
    return false;
  }
}

async function validateGoogleReceipt(purchaseToken: string, productId: string): Promise<boolean> {
  try {
    // For Google Play validation, you would typically use Google Play Developer API
    // This requires setting up Google Cloud credentials and API access
    // For now, we'll implement basic validation
    
    console.log('Google receipt validation - Token:', purchaseToken, 'Product:', productId);
    
    // In a real implementation, you would:
    // 1. Use Google Play Developer API to validate the purchase token
    // 2. Check if the subscription is active and valid
    // 3. Verify the product ID matches
    
    // For development, we'll assume valid if we have a purchase token
    return purchaseToken && purchaseToken.length > 0;
  } catch (error) {
    console.error('Google receipt validation error:', error);
    return false;
  }
}