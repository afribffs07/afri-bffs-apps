
import { Platform, Alert } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { supabase } from './supabase';

export interface IAPProduct {
  productId: string;
  price: string;
  title: string;
  description: string;
}

export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export interface PromotionalOffer {
  identifier: string;
  keyIdentifier: string;
  nonce: string;
  signature: string;
  timestamp: number;
}

class IAPService {
  private products: IAPProduct[] = [];
  private isInitialized = false;

  // Product IDs (you'll need to create these in App Store Connect and Google Play Console)
  private readonly PRODUCT_IDS = {
    PREMIUM_MONTHLY: Platform.select({
      ios: 'afri_bffs_premium_monthly',
      android: 'afri_bffs_premium_monthly',
      default: 'afri_bffs_premium_monthly'
    })!
  };

  async initialize(): Promise<void> {
    try {
      console.log('IAP service initializing...');
      
      if (Platform.OS === 'web') {
        // Web fallback - use mock products
        this.products = [{
          productId: this.PRODUCT_IDS.PREMIUM_MONTHLY,
          price: '$7.99',
          title: 'Afri-BFFs Premium',
          description: 'Monthly premium subscription'
        }];
        this.isInitialized = true;
        console.log('IAP service initialized (web mode - payments not available)');
        return;
      }

      // Initialize InAppPurchases for mobile
      await InAppPurchases.connectAsync();
      
      // Get products from app stores
      const { results } = await InAppPurchases.getProductsAsync([
        this.PRODUCT_IDS.PREMIUM_MONTHLY
      ]);

      this.products = results.map(product => ({
        productId: product.productId,
        price: product.priceString || '$7.99',
        title: product.title || 'Afri-BFFs Premium',
        description: product.description || 'Monthly premium subscription'
      }));
      
      this.isInitialized = true;
      console.log('IAP service initialized with products:', this.products);
    } catch (error) {
      console.error('IAP initialization error:', error);
      
      // Fallback to mock products
      this.products = [{
        productId: this.PRODUCT_IDS.PREMIUM_MONTHLY,
        price: '$7.99',
        title: 'Afri-BFFs Premium',
        description: 'Monthly premium subscription'
      }];
      this.isInitialized = true;
      
      throw new Error(`Failed to initialize in-app purchases: ${(error as Error).message}`);
    }
  }

  async purchaseSubscription(promoCode?: string): Promise<void> {
    try {
      console.log('IAP purchase attempt with promo code:', promoCode);
      
      if (Platform.OS === 'web') {
        const message = 'In-app purchases are not available on web. Please use the mobile app to subscribe.';
        alert(message);
        throw new Error('In-app purchases not available on web');
      }

      if (!this.isInitialized) {
        await this.initialize();
      }
      
      if (promoCode) {
        // Handle promotional offer codes
        await this.handlePromotionalCode(promoCode);
        return;
      }
      
      console.log('Starting purchase for:', this.PRODUCT_IDS.PREMIUM_MONTHLY);
      
      const purchaseResult = await InAppPurchases.purchaseItemAsync(this.PRODUCT_IDS.PREMIUM_MONTHLY);
      
      if (purchaseResult.results && purchaseResult.results.length > 0) {
        const purchase = purchaseResult.results[0];
        
        if (purchase.responseCode === InAppPurchases.IAPResponseCode.OK) {
          console.log('Purchase successful:', purchase);
          
          // Validate the purchase with our backend
          if (Platform.OS === 'ios') {
            await this.validateAppleReceipt(purchase);
          } else if (Platform.OS === 'android') {
            await this.validateGooglePlayReceipt(purchase);
          }
        } else {
          console.log('Purchase failed with response code:', purchase.responseCode);
          throw new Error(`Purchase failed: ${this.getResponseCodeMessage(purchase.responseCode)}`);
        }
      } else {
        throw new Error('Purchase failed: No purchase results returned');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      
      if ((error as Error).message.includes('User cancelled') || (error as Error).message.includes('cancelled')) {
        // User cancelled - don't show error
        return;
      }
      
      throw error;
    }
  }

  private getResponseCodeMessage(responseCode: InAppPurchases.IAPResponseCode): string {
    switch (responseCode) {
      case InAppPurchases.IAPResponseCode.OK:
        return 'Success';
      case InAppPurchases.IAPResponseCode.USER_CANCELED:
        return 'User cancelled';
      case InAppPurchases.IAPResponseCode.PAYMENT_INVALID:
        return 'Payment invalid';
      case InAppPurchases.IAPResponseCode.DEFERRED:
        return 'Payment deferred';
      default:
        return 'Unknown error';
    }
  }

  async handlePromotionalCode(promoCode: string): Promise<void> {
    try {
      console.log('Processing promotional code:', promoCode);
      
      if (Platform.OS === 'ios') {
        await this.handleApplePromotionalOffer(promoCode);
      } else if (Platform.OS === 'android') {
        await this.handleGooglePlayPromotionalCode(promoCode);
      } else {
        throw new Error('Promotional codes not supported on this platform');
      }
    } catch (error) {
      console.error('Promotional code error:', error);
      throw error;
    }
  }

  private async handleApplePromotionalOffer(promoCode: string): Promise<void> {
    try {
      console.log('Processing Apple promotional offer:', promoCode);
      
      // For Apple promotional offers, you would typically:
      // 1. Create promotional offer object with signature
      // 2. Use it in purchaseItemAsync
      
      // For now, show that the feature needs App Store Connect setup
      const message = 'Apple promotional offers require setup in App Store Connect. The promo code has been noted but regular purchase will proceed.';
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Promotional Offer', message);
      }
      
      // Proceed with regular purchase
      const purchaseResult = await InAppPurchases.purchaseItemAsync(this.PRODUCT_IDS.PREMIUM_MONTHLY);
      
      if (purchaseResult.results?.[0]?.responseCode === InAppPurchases.IAPResponseCode.OK) {
        await this.validateAppleReceipt(purchaseResult.results[0]);
      }
    } catch (error) {
      console.error('Apple promotional offer error:', error);
      throw error;
    }
  }

  private async handleGooglePlayPromotionalCode(promoCode: string): Promise<void> {
    try {
      console.log('Processing Google Play promotional code:', promoCode);
      
      // Google Play promotional codes are typically handled server-side
      // or through the Play Store app directly
      
      const message = 'Google Play promotional codes are handled through the Play Store. Please redeem the code in the Play Store app first, then proceed with purchase.';
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Google Play Promotional Code', message);
      }
      
      // Proceed with regular purchase
      const purchaseResult = await InAppPurchases.purchaseItemAsync(this.PRODUCT_IDS.PREMIUM_MONTHLY);
      
      if (purchaseResult.results?.[0]?.responseCode === InAppPurchases.IAPResponseCode.OK) {
        await this.validateGooglePlayReceipt(purchaseResult.results[0]);
      }
    } catch (error) {
      console.error('Google Play promotional code error:', error);
      throw error;
    }
  }

  private async validateAppleReceipt(purchase: InAppPurchases.Purchase): Promise<void> {
    try {
      console.log('Validating Apple receipt...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('validate-iap-receipt', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: {
          platform: 'ios',
          productId: purchase.productId,
          receipt: purchase.transactionReceipt,
          transactionId: purchase.transactionId
        }
      });

      if (error) {
        console.error('Receipt validation error:', error);
        throw error;
      }

      console.log('Apple receipt validated successfully:', data);
    } catch (error) {
      console.error('Apple receipt validation failed:', error);
      throw error;
    }
  }

  private async validateGooglePlayReceipt(purchase: InAppPurchases.Purchase): Promise<void> {
    try {
      console.log('Validating Google Play receipt...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('validate-iap-receipt', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: {
          platform: 'android',
          productId: purchase.productId,
          // purchaseToken: purchase.purchaseToken, // This property is not directly on InAppPurchases.Purchase
          purchaseToken: (purchase as InAppPurchases.GooglePurchase).purchaseToken, // Cast to GooglePurchase for specific property
          transactionId: purchase.orderId
        }
      });

      if (error) {
        console.error('Receipt validation error:', error);
        throw error;
      }

      console.log('Google Play receipt validated successfully:', data);
    } catch (error) {
      console.error('Google Play receipt validation failed:', error);
      throw error;
    }
  }

  async redeemPromotionalCode(code: string): Promise<void> {
    try {
      console.log('Redeeming promotional code:', code);
      
      // Validate the promotional code format
      if (!code || code.length < 3) {
        throw new Error('Invalid promotional code format');
      }
      
      // Process the promotional code through purchase flow
      await this.purchaseSubscription(code);
    } catch (error) {
      console.error('Error redeeming promotional code:', error);
      throw error;
    }
  }

  async checkAvailablePromotionalOffers(): Promise<string[]> {
    try {
      console.log('Checking available promotional offers...');
      
      if (Platform.OS === 'web') {
        return [];
      }
      
      // In a real implementation, you would check with app stores for available offers
      // For now, return empty array as this requires additional setup
      return [];
    } catch (error) {
      console.error('Error checking promotional offers:', error);
      return [];
    }
  }

  async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { subscribed: false };
      }

      console.log('Checking subscription status...');
      
      const { data, error } = await supabase.functions.invoke('check-iap-subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }
      
      return (data as SubscriptionStatus) || { subscribed: false };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { subscribed: false };
    }
  }

  async restorePurchases(): Promise<void> {
    try {
      console.log('Restoring purchases...');
      
      if (Platform.OS === 'web') {
        const message = 'Purchase restoration is not available on web. Please use the mobile app.';
        alert(message);
        return;
      }

      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      console.log('Purchase history:', results);
      
      // Process each historical purchase
      for (const purchase of results) {
        if (purchase.productId === this.PRODUCT_IDS.PREMIUM_MONTHLY) {
          try {
            if (Platform.OS === 'ios') {
              await this.validateAppleReceipt(purchase);
            } else if (Platform.OS === 'android') {
              await this.validateGooglePlayReceipt(purchase);
            }
          } catch (error) {
            console.error('Error validating restored purchase:', error);
            // Continue with other purchases
          }
        }
      }
      
      const message = 'Purchase restoration completed. Your subscription status has been updated.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Restore Complete', message);
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  async openSubscriptionManagement(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const message = 'To manage your subscription:\n\n• iOS: Settings → Apple ID → Subscriptions\n• Android: Play Store → Account → Subscriptions';
        alert(message);
        return;
      }

      const message = Platform.select({
        ios: 'Go to Settings → Apple ID → Subscriptions to manage your subscription',
        android: 'Go to Play Store → Account → Subscriptions to manage your subscription',
        default: 'Subscription management not available on this platform'
      });
      
      Alert.alert('Manage Subscription', message || '', [ // Ensure message is a string for Alert.alert
        { text: 'OK', style: 'default' }
      ]);
    } catch (error) {
      console.error('Error opening subscription management:', error);
      throw new Error('Unable to open subscription management');
    }
  }

  getAvailableProducts(): IAPProduct[] {
    return this.products;
  }

  async disconnect(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await InAppPurchases.disconnectAsync();
      }
      this.isInitialized = false;
      console.log('IAP service disconnected');
    } catch (error) {
      console.error('Error disconnecting IAP service:', error);
    }
  }
}

export const iapService = new IAPService();
