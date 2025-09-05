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
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import ProfileViewModal from '@/components/ui/ProfileViewModal';
import { messageService } from '@/services/messageService';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useSubscription } from '@/hooks/useSubscription';
import { UserProfile } from '@/types/User';
import { Colors, Gradients } from '@/constants/Colors';
import { supabase } from '@/services/supabase';

export default function MatchesScreen() {
  const { user } = useAuth();
  const { markAsViewed } = useNotifications();
  const { hasActiveSubscription } = useSubscription();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  // Mark matches as viewed when page loads
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        markAsViewed('matches');
      }, 500);
    }
  }, [user, markAsViewed]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const matchData = await messageService.getMatches();
      console.log('Loaded matches:', matchData);
      setMatches(matchData);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const profile: UserProfile = {
        id: data.id,
        name: data.name,
        age: data.age,
        bio: data.bio || '',
        photos: data.photos || [],
        location: data.location || {
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          state: 'NY'
        },
        ethnicities: data.ethnicities || [],
        interests: data.interests || [],
        isDiscoverable: data.is_discoverable,
        isPremium: data.is_premium,
        createdAt: data.created_at,
        lastActive: data.last_active,
      };

      setSelectedProfile(profile);
    } catch (error) {
      console.error('Error loading full profile:', error);
    }
  };

  const handleUnmatch = async (matchId: string, userName: string) => {
    const alertTitle = 'Unmatch';
    const alertMessage = `Are you sure you want to unmatch with ${userName}? This action cannot be undone and you will no longer be able to message each other.`;
    
    if (Platform.OS === 'web') {
      if (confirm(`${alertTitle}\n\n${alertMessage}`)) {
        await performUnmatch(matchId);
      }
    } else {
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unmatch', style: 'destructive', onPress: () => performUnmatch(matchId) }
        ]
      );
    }
  };

  const performUnmatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ is_active: false })
        .eq('id', matchId);

      if (error) throw error;

      // Remove from local state
      setMatches(prev => prev.filter(match => match.id !== matchId));

      const message = 'Successfully unmatched';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Unmatched', message);
      }
    } catch (error) {
      console.error('Error unmatching:', error);
      const message = 'Failed to unmatch. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const renderMatch = ({ item }: { item: any }) => (
    <View style={styles.matchCard}>
      <TouchableOpacity onPress={() => loadFullProfile(item.user.id)}>
        <Image
          source={{ uri: item.user.photos?.[0] }}
          style={styles.matchPhoto}
          contentFit="cover"
        />
      </TouchableOpacity>
      <View style={styles.matchInfo}>
        <TouchableOpacity onPress={() => loadFullProfile(item.user.id)}>
          <Text style={styles.matchName}>{item.user.name}</Text>
        </TouchableOpacity>
        <Text style={styles.matchDate}>
          Matched on {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.isFromMe ? 'You: ' : ''}{item.lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.noMessages}>Say hello! 👋</Text>
        )}
      </View>
      <View style={styles.matchActions}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => router.push(`/(tabs)/messages?matchId=${item.id}`)}
        >
          <MaterialIcons name="chat" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.unmatchButton}
          onPress={() => handleUnmatch(item.id, item.user.name)}
        >
          <MaterialIcons name="close" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const showPremiumMessage = () => {
    const message = 'Upgrade to Premium for $7.99/month to read and send messages to your matches!';
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Premium Required', message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Gradients.background} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="favorite" size={60} color={Colors.textLight} />
            <Text style={styles.loadingText}>Loading your matches...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <View style={styles.content}>
          {matches.length > 0 ? (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Matches</Text>
                <Text style={styles.headerSubtitle}>
                  {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                </Text>
              </View>
              
              <FlatList
                data={matches}
                renderItem={renderMatch}
                keyExtractor={(item, index) => `match-${item.id || index}`}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble-outline" size={80} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No Matches Yet</Text>
              <Text style={styles.emptySubtitle}>
                Start swiping to find your new best friends! When you match with someone, they'll appear here.
              </Text>
              <TouchableOpacity
                style={styles.discoverButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.discoverButtonText}>Start Discovering</Text>
              </TouchableOpacity>
            </View>
          )}

          {!hasActiveSubscription && (
            <View style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <MaterialIcons name="lock" size={24} color={Colors.primary} />
                <Text style={styles.messageTitle}>Messaging</Text>
              </View>
              <Text style={styles.messageText}>
                Upgrade to Premium to send and read messages from your matches.
              </Text>
              <TouchableOpacity style={styles.upgradeButton} onPress={showPremiumMessage}>
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ProfileViewModal
          visible={selectedProfile !== null}
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
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
  content: {
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
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  matchPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  noMessages: {
    fontSize: 14,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unmatchButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 30,
  },
  discoverButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 40,
  },
  discoverButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  messageCard: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 12,
  },
  messageText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});