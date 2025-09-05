import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoCarousel from './PhotoCarousel';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '@/types/User';
import { Colors, Gradients } from '@/constants/Colors';

interface ProfileCardProps {
  profile: UserProfile;
  onLike?: () => void;
  onPass?: () => void;
  onPhotoPress?: (photoUrl: string, index: number) => void;
  showActions?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cardWidth = screenWidth - 40;
const maxCardHeight = Math.min(600, screenHeight * 0.65);

export default function ProfileCard({ 
  profile, 
  onLike, 
  onPass, 
  onPhotoPress, 
  showActions = true 
}: ProfileCardProps) {
  return (
    <View style={styles.card}>
      <PhotoCarousel
        photos={profile.photos}
        style={styles.image}
        onPhotoPress={onPhotoPress}
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.name}, {profile.age}</Text>
          <View style={styles.location}>
            <MaterialIcons name="location-on" size={16} color={Colors.surface} />
            <Text style={styles.locationText}>
              {profile.location.city}, {profile.location.state}
            </Text>
          </View>
                    <View style={styles.ethnicities}>
            {profile.ethnicities.map((ethnicity, index) => (
              <View key={`ethnicity-${profile.id}-${ethnicity.code}-${index}`} style={styles.ethnicityItem}>
                <Text style={styles.flag}>{ethnicity.flag}</Text>
                <Text style={styles.ethnicityName}>{ethnicity.name}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <Text style={styles.bio} numberOfLines={3}>
          {profile.bio}
        </Text>
        
        <View style={styles.interests}>
          {profile.interests.slice(0, 3).map((interest, index) => (
            <View key={`interest-${profile.id}-${index}-${interest}`} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
          {profile.interests.length > 3 && (
            <View key={`more-interests-${profile.id}`} style={styles.moreInterestsTag}>
              <Text style={styles.interestText}>+{profile.interests.length - 3}</Text>
            </View>
          )}
        </View>
        
        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.passButton} onPress={onPass}>
              <MaterialIcons name="close" size={32} color={Colors.error} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.likeButton} onPress={onLike}>
              <MaterialIcons name="favorite" size={32} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: maxCardHeight,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: 8,
  },
  ethnicities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ethnicityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flag: {
    fontSize: 16,
    marginRight: 4,
  },
  ethnicityName: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: Colors.surface,
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.9,
  },
  bio: {
    fontSize: 16,
    color: Colors.surface,
    lineHeight: 22,
    marginBottom: 16,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  interestTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  interestText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  moreInterestsTag: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  passButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});