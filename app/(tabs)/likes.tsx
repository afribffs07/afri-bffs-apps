import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import SubscriptionGuard from '@/components/ui/SubscriptionGuard';
import ProfileViewModal from '@/components/ui/ProfileViewModal';
import { profileService } from '@/services/profileService';
import { useSubscription } from '@/hooks/useSubscription';
import { useNotifications } from '@/hooks/useNotifications';
import { UserProfile } from '@/types/User';
import { Colors, Gradients } from '@/constants/Colors';

export default function LikesScreen() {
  const { createSubscription, hasActiveSubscription } = useSubscription();
  const { markAsViewed } = useNotifications();
  const [likedProfiles, setLikedProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (hasActiveSubscription) {
      loadLikedProfiles();
    }
  }, [hasActiveSubscription]);

  // Mark likes as viewed when page loads
  useEffect(() => {
    if (hasActiveSubscription) {
      setTimeout(() => {
        markAsViewed('likes');
      }, 500);
    }
  }, [hasActiveSubscription, markAsViewed]);

  const loadLikedProfiles = async () => {
    setLoading(true);
    try {
      const profiles = await profileService.getProfilesWhoLikedMe();
      setLikedProfiles(profiles);
    } catch (error) {
      console.error('Error loading liked profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (profileId: string) => {
    try {
      const { isMatch } = await profileService.likeProfile(profileId);
      if (isMatch) {
        const message = "It's a match! You can now message each other.";
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('It\'s a Match! 💕', message);
        }
        // Remove from likes list since it's now a match
        setLikedProfiles(prev => prev.filter(p => p.id !== profileId));
      }
    } catch (error) {
      console.error('Error liking profile back:', error);
    }
  };

  const showPremiumUpgrade = async () => {
    try {
      console.log('Premium upgrade button pressed on platform:', Platform.OS);
      await createSubscription();
    } catch (error) {
      console.error('Subscription error details:', {
        message: error.message,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      });
      
      const message = error.message || 'Failed to open subscription page. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const renderLikedProfile = ({ item }: { item: UserProfile }) => (
    <View style={styles.profileCard}>
      <TouchableOpacity onPress={() => setSelectedProfile(item)}>
        <Image
          source={{ uri: item.photos[0] }}
          style={styles.profileImage}
          contentFit="cover"
        />
      </TouchableOpacity>
      <View style={styles.profileInfo}>
        <TouchableOpacity onPress={() => setSelectedProfile(item)}>
          <Text style={styles.profileName}>{item.name}, {item.age}</Text>
        </TouchableOpacity>
        <View style={styles.ethnicities}>
          {item.ethnicities.slice(0, 2).map((ethnicity, index) => (
            <View key={ethnicity.code} style={styles.ethnicityTag}>
              <Text style={styles.flag}>{ethnicity.flag}</Text>
              <Text style={styles.ethnicityName}>{ethnicity.name}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      </View>
      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => handleLikeBack(item.id)}
      >
        <MaterialIcons name="favorite" size={24} color={Colors.surface} />
      </TouchableOpacity>
    </View>
  );

  const PremiumContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Who Likes You</Text>
        <Text style={styles.headerSubtitle}>
          {likedProfiles.length} {likedProfiles.length === 1 ? 'person likes' : 'people like'} you
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <MaterialIcons name="favorite" size={60} color={Colors.textLight} />
          <Text style={styles.loadingText}>Loading your likes...</Text>
        </View>
      ) : likedProfiles.length > 0 ? (
                <FlatList
          data={likedProfiles}
          renderItem={renderLikedProfile}
          keyExtractor={(item, index) => `liked-profile-${item.id || index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="favorite-border" size={80} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No Likes Yet</Text>
          <Text style={styles.emptySubtitle}>
            Keep swiping to find your perfect friends! When someone likes you, they'll appear here.
          </Text>
        </View>
      )}

      <ProfileViewModal
        visible={selectedProfile !== null}
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />
    </View>
  );

  const UpgradePrompt = () => (
    <View style={styles.container}>
      <View style={styles.premiumCard}>
        <LinearGradient colors={Gradients.primary} style={styles.premiumGradient}>
          <MaterialIcons name="favorite" size={80} color={Colors.surface} />
          <Text style={styles.premiumTitle}>See Who Likes You</Text>
          <Text style={styles.premiumSubtitle}>
            Upgrade to Premium and never miss a potential friendship
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={showPremiumUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            <Text style={styles.priceText}>$7.99/month</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={styles.features}>
        <View style={styles.feature}>
          <MaterialIcons name="visibility" size={24} color={Colors.primary} />
          <Text style={styles.featureText}>See who likes you</Text>
        </View>
        <View style={styles.feature}>
          <MaterialIcons name="chat" size={24} color={Colors.primary} />
          <Text style={styles.featureText}>Read all messages</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <SubscriptionGuard 
          feature="seeing who likes you"
          fallbackComponent={<UpgradePrompt />}
        >
          <PremiumContent />
        </SubscriptionGuard>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  ethnicities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  ethnicityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  flag: {
    fontSize: 12,
    marginRight: 2,
  },
  ethnicityName: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  likeButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  premiumCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginTop: 40,
    marginBottom: 40,
  },
  premiumGradient: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.surface,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumSubtitle: {
    fontSize: 16,
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  priceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  features: {
    paddingHorizontal: 20,
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 16,
    fontWeight: '500',
  },
});