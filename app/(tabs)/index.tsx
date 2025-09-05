import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ProfileCard from '@/components/ui/ProfileCard';
import FilterModal from '@/components/ui/FilterModal';
import GlitterText from '@/components/ui/GlitterText';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profileService';
import { UserProfile, FilterSettings } from '@/types/User';
import { Colors, Gradients } from '@/constants/Colors';

export default function DiscoverScreen() {
  const { user, loading } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{
    url: string;
    index: number;
    photos: string[];
  } | null>(null);
  const [filters, setFilters] = useState<FilterSettings>({
    ageRange: { min: 18, max: 35 },
    distance: 25,
    ethnicities: []
  });

  useEffect(() => {
    if (user && !loading) {
      loadCurrentUser();
      loadProfiles();
    }
  }, [user, loading]);

  const loadCurrentUser = async () => {
    try {
      const profile = await profileService.getCurrentProfile();
      setCurrentUser(profile);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadProfiles = async () => {
    if (!user) return;
    
    setLoadingProfiles(true);
    try {
      const filterSettings = await profileService.getFilterSettings();
      setFilters(filterSettings);
      const discoverable = await profileService.getDiscoverableProfiles(filterSettings);
      setProfiles(discoverable);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleLike = async () => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user) return;

    try {
      const { isMatch } = await profileService.likeProfile(currentProfile.id);
      
      if (isMatch) {
        const message = `It's a match! You can now message ${currentProfile.name}`;
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('It\'s a Match! 💕', message);
        }
      }

      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        loadProfiles(); // Load more profiles
      }
    } catch (error) {
      console.error('Error liking profile:', error);
      // Still move to next profile even if like failed
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handlePass = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      loadProfiles(); // Load more profiles
    }
  };

  const handleApplyFilters = (newFilters: FilterSettings) => {
    setFilters(newFilters);
    setProfiles([]);
    setCurrentIndex(0);
    loadProfiles();
  };

  const handlePhotoPress = (photoUrl: string, index: number) => {
    const currentProfile = profiles[currentIndex];
    if (currentProfile) {
      setEnlargedPhoto({
        url: photoUrl,
        index,
        photos: currentProfile.photos
      });
    }
  };

  const closeEnlargedPhoto = () => {
    setEnlargedPhoto(null);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Gradients.background} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <GlitterText size={32}>Afri-BFFs</GlitterText>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  // Show profile setup if user doesn't have a profile
  if (!currentUser && !loadingProfiles) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Gradients.background} style={styles.gradient}>
          <View style={styles.setupContainer}>
            <GlitterText size={32}>Afri-BFFs</GlitterText>
            <Text style={styles.setupText}>Complete your profile to start meeting amazing friends!</Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => router.push('/profile-setup')}
            >
              <Text style={styles.setupButtonText}>Set Up Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <View style={styles.header}>
          <GlitterText size={24}>Afri-BFFs</GlitterText>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="tune" size={24} color={Colors.primary} />
            {(filters.ethnicities.length > 0 || filters.distance < 100 || 
              filters.ageRange.min > 18 || filters.ageRange.max < 50) && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {filters.ethnicities.length + (filters.distance < 100 ? 1 : 0) + 
                   (filters.ageRange.min > 18 || filters.ageRange.max < 50 ? 1 : 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          {currentProfile ? (
            <ProfileCard
              profile={currentProfile}
              onLike={handleLike}
              onPass={handlePass}
              onPhotoPress={handlePhotoPress}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="explore" size={80} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No More Profiles</Text>
              <Text style={styles.emptySubtitle}>
                {profiles.length === 0 ? 
                  'Expand your filters or check back later for new people to meet!' :
                  'Check back later for new people to meet, or adjust your discovery settings!'
                }
              </Text>
              <TouchableOpacity 
                style={[styles.refreshButton, loadingProfiles && styles.refreshButtonDisabled]} 
                onPress={loadProfiles}
                disabled={loadingProfiles}
              >
                <Text style={styles.refreshButtonText}>
                  {loadingProfiles ? 'Loading...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Math.max(0, profiles.length - currentIndex)} more friends to discover
          </Text>
          {filters.distance < 100 && (
            <Text style={styles.filterInfo}>
              {`Showing within ${filters.distance} miles`}
              {filters.ethnicities.length > 0 && ` • ${filters.ethnicities.length} ethnicities`}
              {(filters.ageRange.min > 18 || filters.ageRange.max < 50) && 
               ` • Ages ${filters.ageRange.min}-${filters.ageRange.max}`}
            </Text>
          )}
        </View>

        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
        />

        {/* Photo Enlargement Modal */}
        {enlargedPhoto && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={closeEnlargedPhoto}
          >
            <View style={styles.photoModal}>
              <TouchableOpacity 
                style={styles.photoModalBackground}
                onPress={closeEnlargedPhoto}
                activeOpacity={1}
              >
                <View style={styles.photoModalContent}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={closeEnlargedPhoto}
                  >
                    <MaterialIcons name="close" size={30} color={Colors.surface} />
                  </TouchableOpacity>
                  
                  <Image
                    source={{ uri: enlargedPhoto.url }}
                    style={styles.enlargedPhoto}
                    contentFit="contain"
                  />
                  
                  {enlargedPhoto.photos.length > 1 && (
                    <View style={styles.photoIndicators}>
                      {enlargedPhoto.photos.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.photoIndicator,
                            index === enlargedPhoto.index && styles.activePhotoIndicator
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    zIndex: 10,
    elevation: 10,
  },
  filterButton: {
    position: 'relative',
    padding: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 20,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContent: {
    position: 'relative',
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: -40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activePhotoIndicator: {
    backgroundColor: Colors.primary,
  },
});