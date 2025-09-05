import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoCarousel from '@/components/ui/PhotoCarousel';
import ProfileCard from '@/components/ui/ProfileCard';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GlitterText from '@/components/ui/GlitterText';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profileService';
import { useSubscription } from '@/hooks/useSubscription';
import { UserProfile } from '@/types/User';
import { Colors, Gradients } from '@/constants/Colors';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const { createSubscription, openCustomerPortal, hasActiveSubscription } = useSubscription();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const currentProfile = await profileService.getCurrentProfile();
      setProfile(currentProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDiscoverability = async () => {
    if (!profile) return;
    
    try {
      const updatedProfile = await profileService.updateProfile({
        isDiscoverable: !profile.isDiscoverable
      });
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to update discoverability:', error);
      const message = 'Failed to update profile visibility. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await signOut();
      if (error) {
        const message = 'Failed to sign out. Please try again.';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Error', message);
        }
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
      const message = 'Failed to sign out. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoggingOut(false);
    }
  };

  const showDeleteAccountAlert = () => {
    const alertTitle = 'Delete Account';
    const alertMessage = 'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data including matches, messages, and profile information.';
    
    if (Platform.OS === 'web') {
      if (confirm(`${alertTitle}\n\n${alertMessage}`)) {
        handleDeleteAccount();
      }
    } else {
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Forever', style: 'destructive', onPress: handleDeleteAccount }
        ]
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await deleteAccount();
      if (error) {
        const message = 'Failed to delete account. Please try again.';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Error', message);
        }
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      const message = 'Failed to delete account. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const showSubscriptionAlert = async () => {
    try {
      await createSubscription();
    } catch (error) {
      const message = 'Failed to open subscription page. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      const message = 'Failed to open subscription management. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Gradients.background} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="person" size={60} color={Colors.textLight} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Gradients.background} style={styles.gradient}>
          <View style={styles.setupContainer}>
                                                                                                <GlitterText size={28}>Welcome to Afri-BFFs!</GlitterText>
            <Text style={styles.setupText}>Create your profile to start meeting amazing friends</Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => router.push('/profile-setup')}
            >
              <Text style={styles.setupButtonText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={() => setShowProfilePreview(true)}
              activeOpacity={0.8}
            >
              <PhotoCarousel
                photos={profile.photos}
                style={styles.profileImage}
                hideArrows={true}
              />
              {hasActiveSubscription && (
                <View style={styles.premiumBadge}>
                  <MaterialIcons name="star" size={16} color={Colors.surface} />
                </View>
              )}
              <View style={styles.previewOverlay}>
                <MaterialIcons name="visibility" size={20} color={Colors.surface} />
                <Text style={styles.previewText}>Preview</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            <View style={styles.ethnicities}>
              {profile.ethnicities.map((ethnicity, index) => (
                <View key={ethnicity.code} style={styles.ethnicityTag}>
                  <Text style={styles.flag}>{ethnicity.flag}</Text>
                  <Text style={styles.ethnicityName}>{ethnicity.name}</Text>
                </View>
              ))}
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>

        {profile.interests.length > 0 && (
          <View style={styles.interestsSection}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsGrid}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestBadge}>
                  <Text style={styles.interestBadgeText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

          {!hasActiveSubscription && (
            <TouchableOpacity style={styles.premiumCard} onPress={showSubscriptionAlert}>
              <LinearGradient colors={Gradients.primary} style={styles.premiumGradient}>
                <MaterialIcons name="star" size={24} color={Colors.surface} />
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumSubtitle}>$7.99/month</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={24} color={Colors.surface} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="visibility" size={24} color={Colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Profile Visibility</Text>
                  <Text style={styles.settingSubtitle}>
                    {profile.isDiscoverable 
                      ? 'Your profile is visible to others' 
                      : 'Your profile is hidden from discovery'
                    }
                  </Text>
                </View>
              </View>
              <Switch
                value={profile.isDiscoverable}
                onValueChange={toggleDiscoverability}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={profile.isDiscoverable ? Colors.primary : Colors.textLight}
              />
            </View>

            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/profile-setup')}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="edit" size={24} color={Colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Edit Profile</Text>
                  <Text style={styles.settingSubtitle}>Update your photos and information</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, loggingOut && styles.settingItemDisabled]} 
              onPress={handleLogout}
              disabled={loggingOut}
            >
              <View style={styles.settingLeft}>
                <MaterialIcons name="logout" size={24} color={Colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>
                    {loggingOut ? 'Signing Out...' : 'Sign Out'}
                  </Text>
                  <Text style={styles.settingSubtitle}>Sign out of your account</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>

            {hasActiveSubscription && (
            <TouchableOpacity style={styles.settingItem} onPress={handleManageSubscription}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="star" size={24} color={Colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Manage Subscription</Text>
                  <Text style={styles.settingSubtitle}>
                    {Platform.OS === 'ios' ? 'Manage via App Store' : 'Manage via Google Play'}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            )}
          </View>

          <View style={styles.dangerSection}>
            <TouchableOpacity style={styles.dangerButton} onPress={showDeleteAccountAlert}>
              <MaterialIcons name="delete-forever" size={24} color={Colors.error} />
              <Text style={styles.dangerButtonText}>Delete Account Forever</Text>
            </TouchableOpacity>
            <Text style={styles.dangerText}>
              This will permanently delete your account, matches, messages, and all data. This action cannot be undone.
            </Text>
          </View>
        </ScrollView>

        {/* Profile Preview Modal */}
        {profile && (
          <Modal
            visible={showProfilePreview}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <SafeAreaView style={styles.previewModal}>
              <LinearGradient colors={Gradients.background} style={styles.gradient}>
                <View style={styles.previewHeader}>
                  <TouchableOpacity 
                    style={styles.previewCloseButton} 
                    onPress={() => setShowProfilePreview(false)}
                  >
                    <MaterialIcons name="close" size={28} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.previewHeaderTitle}>Profile Preview</Text>
                  <View style={styles.previewHeaderSpacer} />
                </View>

                <View style={styles.previewContent}>
                  <Text style={styles.previewDescription}>
                    This is how your profile appears to other users on the Discover page
                  </Text>
                  
                  <View style={styles.previewCardContainer}>
                    <ProfileCard
                      profile={profile}
                      showActions={false}
                    />
                  </View>
                </View>
              </LinearGradient>
            </SafeAreaView>
          </Modal>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  setupText: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 30,
    lineHeight: 26,
  },
  setupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
  },
  setupButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  previewModal: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  previewCloseButton: {
    padding: 4,
  },
  previewHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  previewHeaderSpacer: {
    width: 36,
  },
  previewContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  previewDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  previewCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  premiumBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  ethnicities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  ethnicityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flag: {
    fontSize: 16,
    marginRight: 6,
  },
  ethnicityName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  bioSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  bio: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  premiumCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  premiumText: {
    flex: 1,
    marginLeft: 16,
  },
  premiumTitle: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumSubtitle: {
    color: Colors.surface,
    fontSize: 14,
    opacity: 0.9,
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dangerSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    marginBottom: 12,
  },
  dangerButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dangerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  interestsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestBadgeText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
});