import { Platform, Alert } from 'react-native';
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
      
      // Mock products until expo-in-app-purchases is installed
      this.products = [{
        productId: this.PRODUCT_IDS.PREMIUM_MONTHLY,
        price: '$7.99',
        title: 'Afri-BFFs Premium',
        description: 'Monthly premium subscription'
      }];
      
      this.isInitialized = true;
      console.log('IAP service initialized (mock mode)');
    } catch (error) {
      console.error('IAP initialization error:', error);
      throw new Error(`Failed to initialize in-app purchases: ${error.message}`);
    }
  }

  async purchaseSubscription(promoCode?: string): Promise<void> {
    try {
      console.log('IAP purchase attempt with promo code:', promoCode);
      
      if (promoCode) {
        // Handle promotional offer codes
        await this.handlePromotionalCode(promoCode);
        return;
      }
      
      console.log('IAP not available - install expo-in-app-purchases first');
      
      const message = Platform.OS === 'web' 
        ? 'In-app purchases are not available on web. Please use the mobile app.'
        : 'Please install expo-in-app-purchases package first:\n\nnpx expo install expo-in-app-purchases';
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Package Required', message);
      }
      
      throw new Error('expo-in-app-purchases not installed');
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
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
      
      // For now, show instruction to install expo-in-app-purchases
      const message = 'To redeem Apple promotional offers:\n\n1. Install expo-in-app-purchases\n2. Configure promotional offers in App Store Connect\n3. Use the promotional offer API\n\nPromo code: ' + promoCode;
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Apple Promotional Offer', message);
      }
      
      // When expo-in-app-purchases is installed, this would be:
      /*
      const promotionalOffer: PromotionalOffer = {
        identifier: promoCode,
        keyIdentifier: 'PROMO_KEY_ID', // From App Store Connect
        nonce: generateNonce(),
        signature: generateSignature(promoCode),
        timestamp: Date.now()
      };
      
      const purchaseResult = await InAppPurchases.purchaseItemAsync({
        productId: this.PRODUCT_IDS.PREMIUM_MONTHLY,
        promotionalOffer: promotionalOffer
      });
      
      if (purchaseResult.results?.[0]?.responseCode === InAppPurchases.IAPResponseCode.OK) {
        await this.validateAppleReceipt(purchaseResult.results[0]);
      }
      */
    } catch (error) {
      console.error('Apple promotional offer error:', error);
      throw error;
    }
  }

  private async handleGooglePlayPromotionalCode(promoCode: string): Promise<void> {
    try {
      console.log('Processing Google Play promotional code:', promoCode);
      
      // For now, show instruction to install expo-in-app-purchases
      const message = 'To redeem Google Play promotional codes:\n\n1. Install expo-in-app-purchases\n2. Configure promotional codes in Google Play Console\n3. Use the promotional pricing API\n\nPromo code: ' + promoCode;
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Google Play Promotional Code', message);
      }
      
      // When expo-in-app-purchases is installed, this would be:
      /*
      // Google Play handles promo codes differently - they're usually handled server-side
      // or through the Play Store app directly. For in-app redemption:
      
      const purchaseResult = await InAppPurchases.purchaseItemAsync({
        productId: this.PRODUCT_IDS.PREMIUM_MONTHLY,
        offerToken: promoCode // If using promotional pricing
      });
      
      if (purchaseResult.results?.[0]?.responseCode === InAppPurchases.IAPResponseCode.OK) {
        await this.validateGooglePlayReceipt(purchaseResult.results[0]);
      }
      */
    } catch (error) {
      console.error('Google Play promotional code error:', error);
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
      
      // For now, simulate successful redemption
      const message = `Promotional code "${code}" ready for redemption.\n\nNote: Install expo-in-app-purchases to enable full functionality.`;
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Promotional Code Ready', message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Redeem', onPress: () => this.purchaseSubscription(code) }
        ]);
      }
    } catch (error) {
      console.error('Error redeeming promotional code:', error);
      throw error;
    }
  }

  async checkAvailablePromotionalOffers(): Promise<string[]> {
    try {
      // When expo-in-app-purchases is installed, this would check for available offers
      console.log('Checking available promotional offers...');
      
      // Mock available offers for now
      return ['WELCOME50', 'FRIEND25', 'STUDENT20'];
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
      
      return data || { subscribed: false };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { subscribed: false };
    }
  }

  async restorePurchases(): Promise<void> {
    try {
      console.log('Restore purchases not available - install expo-in-app-purchases first');
      
      const message = 'Please install expo-in-app-purchases package first';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Package Required', message);
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  async openSubscriptionManagement(): Promise<void> {
    try {
      const message = Platform.select({
        ios: 'Go to Settings > Apple ID > Subscriptions to manage your subscription',
        android: 'Go to Play Store > Account > Subscriptions to manage your subscription',
        default: 'Subscription management not available on this platform'
      });
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Manage Subscription', message);
      }
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
      this.isInitialized = false;
      console.log('IAP service disconnected');
    } catch (error) {
      console.error('Error disconnecting IAP service:', error);
    }
  }
}

export const iapService = new IAPService();