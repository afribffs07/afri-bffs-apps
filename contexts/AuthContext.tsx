import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  sendOtpCode: (email: string, type: 'signup' | 'magiclink') => Promise<{ error: any }>;
  verifyOtpCode: (email: string, token: string, type: 'signup' | 'magiclink') => Promise<{ error: any }>;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
  deleteAccount: () => Promise<{ error: any }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        // Handle email confirmation
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          // Check if this is from email confirmation by looking at the URL or session metadata
          const isFromEmailConfirmation = session.user.app_metadata?.provider === 'email' && 
                                         !session.user.user_metadata?.email_confirmed_redirect_handled;
          
          if (isFromEmailConfirmation) {
            // Mark as handled to prevent multiple redirects
            await supabase.auth.updateUser({
              data: { email_confirmed_redirect_handled: true }
            });
            
            // Redirect to email confirmed page
            setTimeout(() => {
              try {
                const { router } = require('expo-router');
                router.replace('/auth/email-confirmed');
              } catch (error) {
                console.log('Router not available during auth state change');
              }
            }, 500);
          }
        }
        
        // Only update if there's an actual change
        setSession(prevSession => {
          if (prevSession?.access_token !== session?.access_token) {
            return session;
          }
          return prevSession;
        });
        
        setUser(prevUser => {
          if (prevUser?.id !== session?.user?.id) {
            return session?.user ?? null;
          }
          return prevUser;
        });
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    try {
      console.log('Attempting signup with metadata:', metadata);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (data?.user && !error) {
        console.log('User created successfully:', data.user.id);
      }
      
      return { error };
    } catch (err) {
      console.error('Signup exception:', err);
      return { error: { message: 'Network error. Please check your connection and try again.' } };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const sendOtpCode = async (email: string, type: 'signup' | 'magiclink') => {
    setLoading(true);
    try {
      console.log('Sending OTP code to:', email, 'type:', type);
      
      // Force OTP by explicitly setting options and avoiding any redirect URLs
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: type === 'signup',
          // Explicitly remove any redirect configurations
          emailRedirectTo: undefined,
          data: { 
            otp_type: 'email',
            disable_signup: false
          }
        }
      });
      
      if (error) {
        console.error('OTP send error:', error);
      } else {
        console.log('OTP request sent successfully');
      }
      
      return { error };
    } catch (err) {
      console.error('OTP send exception:', err);
      return { error: { message: 'Network error. Please check your connection and try again.' } };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpCode = async (email: string, token: string, type: 'signup' | 'magiclink') => {
    setLoading(true);
    try {
      console.log('Verifying OTP code for:', email, 'type:', type);
      
      // Explicitly use 'email' type for OTP verification (not 'magiclink')
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email' // Force email OTP verification
      });
      
      if (error) {
        console.error('OTP verification error:', error);
      } else {
        console.log('OTP verified successfully');
      }
      
      return { error };
    } catch (err) {
      console.error('OTP verification exception:', err);
      return { error: { message: 'Network error. Please check your connection and try again.' } };
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhone = async (phone: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // For OTP-based password reset, we'll send an OTP code
      console.log('Sending password reset OTP to:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create user for password reset
          emailRedirectTo: undefined, // Force OTP instead of magic link
        },
      });
      
      if (error) {
        console.error('Password reset error:', error);
      } else {
        console.log('Password reset OTP sent successfully');
      }
      
      return { error };
    } catch (err) {
      console.error('Password reset exception:', err);
      return { error: { message: 'Failed to send reset code. Please try again.' } };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: 'No user logged in' };
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const deleteAccount = async () => {
    if (!user) return { error: 'No user logged in' };
    
    try {
      // Delete user profile (cascades to other tables)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) return { error: profileError };
      
      // Sign out
      const { error: signOutError } = await supabase.auth.signOut();
      return { error: signOutError };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    sendOtpCode,
    verifyOtpCode,
    signInWithPhone,
    verifyOtp,
    signOut,
    resetPassword,
    updateProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}