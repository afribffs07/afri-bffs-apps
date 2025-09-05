
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GlitterText from '@/components/ui/GlitterText';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { Colors, Gradients } from '@/constants/Colors';

export default function EmailConfirmedScreen() {
  const { user } = useAuth();

    useEffect(() => {
    // If user is already signed in after email confirmation, send welcome email and redirect
    if (user) {
      // Send welcome email
      sendWelcomeEmail();
      
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 3000); // Auto redirect after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [user]);

  const sendWelcomeEmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke('send-welcome-email', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        console.log('Welcome email sent successfully');
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't show error to user as this is a background operation
    }
  };

  const handleContinue = () => {
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={80} color={Colors.success} />
            </View>
          </View>

          <View style={styles.textContainer}>
            <GlitterText size={32}>Email Confirmed!</GlitterText>
            <Text style={styles.message}>
              Your email address has been successfully confirmed. Welcome to Afri-BFFs!
            </Text>
            
            {user ? (
              <>
                <Text style={styles.subMessage}>
                  You will be redirected to the app in a few seconds, or you can continue now.
                </Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                >
                  <Text style={styles.continueButtonText}>Continue to App</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.subMessage}>
                  You can now sign in to your account and start finding amazing friends!
                </Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                >
                  <Text style={styles.continueButtonText}>Sign In Now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Thank you for joining our community of friendship!
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  message: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
    lineHeight: 26,
  },
  subMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
