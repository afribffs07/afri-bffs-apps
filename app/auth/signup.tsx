import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GlitterText from '@/components/ui/GlitterText';
import DocumentViewer from '@/components/ui/DocumentViewer';
import { useAuth } from '@/hooks/useAuth';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '@/constants/LegalDocuments';
import { Colors, Gradients } from '@/constants/Colors';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const { sendOtpCode } = useAuth();

  const handleSignUp = async () => {
    if (!email.trim() || !name.trim() || !age.trim()) {
      const message = 'Please fill in all required fields';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    const ageNumber = parseInt(age);
    if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 100) {
      const message = 'Please enter a valid age between 18 and 100';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const message = 'Please enter a valid email address';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    if (!agreeToTerms || !agreeToPrivacy) {
      const message = 'You must agree to both the Terms of Service and Privacy Policy to create an account';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Agreement Required', message);
      }
      return;
    }

    setIsLoading(true);

    const { error } = await sendOtpCode(email.trim(), 'signup');
    setIsLoading(false);

    if (error) {
      console.error('Signup error:', error);
      let message = 'Failed to send verification code. Please try again.';
      
      if (error.message?.includes('already registered')) {
        message = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message?.includes('Invalid email')) {
        message = 'Please enter a valid email address.';
      }
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Sign Up Error', message);
      }
    } else {
      // Navigate to OTP verification screen
      router.push({
        pathname: '/auth/verify-email-otp',
        params: { 
          email: email.trim(), 
          type: 'signup',
          name: name.trim(),
          age: age.trim()
        }
      });
    }
  };

  const toggleTermsAgreement = () => {
    setAgreeToTerms(!agreeToTerms);
  };

  const togglePrivacyAgreement = () => {
    setAgreeToPrivacy(!agreeToPrivacy);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={styles.header}>
                <GlitterText size={36}>Afri-BFFs</GlitterText>
                <Text style={styles.subtitle}>Create your account and find amazing friends!</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.textSecondary}
                    autoComplete="name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    placeholder="Enter your age"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                {/* Legal Agreements Section */}
                <View style={styles.agreementsSection}>
                  <Text style={styles.agreementsTitle}>Legal Agreements</Text>
                  <Text style={styles.agreementsSubtitle}>
                    Please read and agree to our terms to create your account
                  </Text>

                  {/* Terms of Service Agreement */}
                  <View style={styles.agreementItem}>
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={toggleTermsAgreement}
                    >
                      <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                        {agreeToTerms && (
                          <MaterialIcons name="check" size={16} color={Colors.surface} />
                        )}
                      </View>
                      <View style={styles.agreementTextContainer}>
                        <Text style={styles.agreementText}>
                          I agree to the{' '}
                          <Text 
                            style={styles.linkText}
                            onPress={() => setShowTermsModal(true)}
                          >
                            Terms of Service
                          </Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Privacy Policy Agreement */}
                  <View style={styles.agreementItem}>
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={togglePrivacyAgreement}
                    >
                      <View style={[styles.checkbox, agreeToPrivacy && styles.checkboxChecked]}>
                        {agreeToPrivacy && (
                          <MaterialIcons name="check" size={16} color={Colors.surface} />
                        )}
                      </View>
                      <View style={styles.agreementTextContainer}>
                        <Text style={styles.agreementText}>
                          I agree to the{' '}
                          <Text 
                            style={styles.linkText}
                            onPress={() => setShowPrivacyModal(true)}
                          >
                            Privacy Policy
                          </Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.agreementNote}>
                    By creating an account, you confirm that you are at least 18 years old and agree to abide by our community guidelines.
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.signUpButton, 
                    (isLoading || !agreeToTerms || !agreeToPrivacy) && styles.signUpButtonDisabled
                  ]}
                  onPress={handleSignUp}
                  disabled={isLoading || !agreeToTerms || !agreeToPrivacy}
                >
                  <Text style={styles.signUpButtonText}>
                    {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/auth/login')}>
                    <Text style={styles.linkText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* Document Modals */}
        <DocumentViewer
          visible={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          title="Terms of Service"
          content={TERMS_OF_SERVICE}
        />

        <DocumentViewer
          visible={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          title="Privacy Policy"
          content={PRIVACY_POLICY}
        />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.select({
      android: 50,
      default: 20,
    }),
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
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
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  agreementsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  agreementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  agreementsSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  agreementItem: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  agreementNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 8,
    fontStyle: 'italic',
  },
  signUpButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});