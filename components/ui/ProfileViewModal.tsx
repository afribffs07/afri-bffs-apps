import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoCarousel from './PhotoCarousel';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '@/types/User';
import { Colors, Gradients } from '@/constants/Colors';

interface ProfileViewModalProps {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
}

export default function ProfileViewModal({ visible, profile, onClose }: ProfileViewModalProps) {
  const [enlargedPhoto, setEnlargedPhoto] = useState<{
    url: string;
    index: number;
    photos: string[];
  } | null>(null);

  if (!profile) return null;

  const handlePhotoPress = (photoUrl: string, index: number) => {
    setEnlargedPhoto({
      url: photoUrl,
      index,
      photos: profile.photos
    });
  };

  const closeEnlargedPhoto = () => {
    setEnlargedPhoto(null);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.container}>
          <LinearGradient colors={Gradients.background} style={styles.gradient}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.profileCard}>
                <PhotoCarousel
                  photos={profile.photos}
                  style={styles.image}
                  onPhotoPress={handlePhotoPress}
                />
                
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.overlay}
                />
                
                <View style={styles.profileContent}>
                  <View style={styles.profileHeader}>
                    <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                    <View style={styles.location}>
                      <MaterialIcons name="location-on" size={16} color={Colors.surface} />
                      <Text style={styles.locationText}>
                        {profile.location.city}, {profile.location.state}
                      </Text>
                    </View>
                    <View style={styles.ethnicities}>
                      {profile.ethnicities.map((ethnicity, index) => (
                        <View key={ethnicity.code} style={styles.ethnicityItem}>
                          <Text style={styles.flag}>{ethnicity.flag}</Text>
                          <Text style={styles.ethnicityName}>{ethnicity.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <Text style={styles.bio}>{profile.bio}</Text>
                  
                  <View style={styles.interests}>
                    {profile.interests.map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </SafeAreaView>
      </Modal>

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
                  style={styles.photoCloseButton}
                  onPress={closeEnlargedPhoto}
                >
                  <MaterialIcons name="close" size={30} color={Colors.surface} />
                </TouchableOpacity>
                
                <PhotoCarousel
                  photos={enlargedPhoto.photos}
                  style={styles.enlargedPhoto}
                />
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    borderRadius: 20,
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    height: 600,
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
  profileContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  profileHeader: {
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: 8,
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
  photoCloseButton: {
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
});