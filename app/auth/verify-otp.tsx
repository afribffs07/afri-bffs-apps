import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import GlitterText from '@/components/ui/GlitterText';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Gradients } from '@/constants/Colors';

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { verifyOtp, signInWithPhone } = useAuth();

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      const message = 'Please enter a valid 6-digit OTP';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    setIsLoading(true);
    const { error } = await verifyOtp(phone, otp.trim());
    setIsLoading(false);

    if (error) {
      const message = error.message || 'Invalid OTP';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Verification Error', message);
      }
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    const { error } = await signInWithPhone(phone);
    setResendLoading(false);

    if (error) {
      const message = error.message || 'Failed to resend OTP';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } else {
      const message = 'OTP sent successfully!';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Success', message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.header}>
                                                <GlitterText size={32}>Verify Phone</GlitterText>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to {phone}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={setOtp}
                placeholder="123456"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
                fontSize={24}
                letterSpacing={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Did not receive the code? </Text>
              <TouchableOpacity 
                onPress={handleResendOtp}
                disabled={resendLoading}
              >
                <Text style={[styles.resendLink, resendLoading && styles.resendLinkDisabled]}>
                  {resendLoading ? 'Sending...' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    color: Colors.text,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  resendLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.6,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});