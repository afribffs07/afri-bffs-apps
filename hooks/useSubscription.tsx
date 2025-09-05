
import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { iapService, SubscriptionStatus } from '@/services/iapService';
import { useAuth } from './useAuth';

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({ subscribed: false });
  const [loading, setLoading] = useState(false);
  
  const lastChecked = useRef<number>(0);
  const checkInProgress = useRef(false);
  const lastUserId = useRef<string | null>(null);

  // Initialize IAP service when hook is first used
  useEffect(() => {
    const initializeIAP = async () => {
      try {
        await iapService.initialize();
        console.log('IAP service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize IAP service:', error);
        // Continue anyway - the service will handle fallbacks
      }
    };

    initializeIAP();

    // Cleanup on unmount
    return () => {
      iapService.disconnect();
    };
  }, []);

  const checkSubscriptionStatus = useCallback(async (force = false) => {
    if (!user || checkInProgress.current) return;
    
    const now = Date.now();
    if (!force && now - lastChecked.current < 120000) return;

    checkInProgress.current = true;
    setLoading(true);
    
    try {
      const newStatus = await iapService.checkSubscriptionStatus();
      setStatus(prevStatus => {
        if (prevStatus.subscribed !== newStatus.subscribed) {
          return newStatus;
        }
        return prevStatus;
      });
      lastChecked.current = now;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    } finally {
      setLoading(false);
      checkInProgress.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id !== lastUserId.current) {
      lastUserId.current = user?.id || null;
      if (user) {
        checkSubscriptionStatus(true);
      } else {
        setStatus({ subscribed: false });
        lastChecked.current = 0;
      }
    }
  }, [user?.id, checkSubscriptionStatus]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkSubscriptionStatus();
    }, 300000);

    return () => clearInterval(interval);
  }, [user?.id, checkSubscriptionStatus]);

  const createSubscription = async (promoCode?: string) => {
    setLoading(true);
    try {
      console.log('Starting IAP subscription creation with promo code:', promoCode);
      await iapService.purchaseSubscription(promoCode);
      setTimeout(() => checkSubscriptionStatus(true), 3000);
    } catch (error: any) { // Add ': any' type annotation for the 'error' parameter
      console.error('Failed to create subscription:', error);
      console.error('IAP subscription error details:', {
        platform: Platform.OS,
        errorMessage: error.message,
        errorStack: error.stack,
        promoCode
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const redeemPromotionalCode = async (code: string) => {
    setLoading(true);
    try {
      console.log('Redeeming promotional code:', code);
      await iapService.redeemPromotionalCode(code);
      setTimeout(() => checkSubscriptionStatus(true), 2000);
    } catch (error: any) { // Add ': any' type annotation for the 'error' parameter
      console.error('Failed to redeem promotional code:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkAvailableOffers = async () => {
    try {
      return await iapService.checkAvailablePromotionalOffers();
    } catch (error: any) { // Add ': any' type annotation for the 'error' parameter
      console.error('Failed to check available offers:', error);
      return [];
    }
  };

  const openCustomerPortal = async () => {
    setLoading(true);
    try {
      await iapService.openSubscriptionManagement();
      setTimeout(() => checkSubscriptionStatus(true), 2000);
    } catch (error: any) { // Add ': any' type annotation for the 'error' parameter
      console.error('Failed to open subscription management:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    setLoading(true);
    try {
      await iapService.restorePurchases();
      checkSubscriptionStatus(true);
    } catch (error: any) { // Add ': any' type annotation for the 'error' parameter
      console.error('Failed to restore purchases:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    ...status,
    loading,
    hasActiveSubscription: status.subscribed,
    isPremium: status.subscribed,
    checkSubscriptionStatus: () => checkSubscriptionStatus(true),
    createSubscription,
    redeemPromotionalCode,
    checkAvailableOffers,
    openCustomerPortal,
    restorePurchases,
  };
}
