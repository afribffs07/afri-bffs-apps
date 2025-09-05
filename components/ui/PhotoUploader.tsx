import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUploader({ photos, onPhotosChange, maxPhotos = 6 }: PhotoUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

    const requestPermissions = async () => {
    try {
      // First check current permission status
      const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      if (currentStatus === 'granted') {
        return true;
      }
      
      // If not granted, request permission
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      }
      
      // Handle different denial scenarios
      let message = 'We need access to your photos to upload profile pictures.';
      let title = 'Photo Access Required';
      
      if (!canAskAgain) {
        message = 'Photo access was denied. Please go to Settings > Apps > Afri-BFFs > Permissions > Photos and enable access to upload profile pictures.';
        title = 'Enable Photo Access';
      }
      
      if (Platform.OS === 'web') {
        alert(`${title}\n\n${message}`);
      } else {
        Alert.alert(title, message, [
          { text: 'Cancel', style: 'cancel' },
          ...((!canAskAgain) ? [{ 
            text: 'Open Settings', 
            onPress: () => {
              // Note: This would require expo-linking or expo-intent-launcher
              // For now, just show instruction
              Alert.alert('Manual Setup', 'Go to your device Settings > Apps > Afri-BFFs > Permissions > Photos and enable access.');
            }
          }] : [])
        ]);
      }
      
      return false;
    } catch (error) {
      console.error('Permission request error:', error);
      const message = 'Unable to request photo permissions. Please check your device settings.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Permission Error', message);
      }
      return false;
    }
  };

    const uploadPhoto = async (uri: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Create unique filename
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      let uploadData: any;
      
      if (Platform.OS === 'web') {
        // Web: Use fetch + blob approach
        const response = await fetch(uri);
        const blob = await response.blob();
        uploadData = blob;
      } else {
        // Mobile: Use FormData for local file handling
        const formData = new FormData();
        formData.append('file', {
          uri: uri,
          type: 'image/jpeg',
          name: fileName,
        } as any);
        uploadData = formData;
      }
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, uploadData, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleImageSelection = async (source: 'camera' | 'library') => {
    setShowImagePicker(false);
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      };

      let result;
      if (source === 'camera') {
                const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          let message = 'We need camera access to take profile photos.';
          let title = 'Camera Access Required';
          
          if (!canAskAgain) {
            message = 'Camera access was denied. Please go to Settings > Apps > Afri-BFFs > Permissions > Camera and enable access.';
            title = 'Enable Camera Access';
          }
          
          if (Platform.OS === 'web') {
            alert(`${title}\n\n${message}`);
          } else {
            Alert.alert(title, message);
          }
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const uploadedUrl = await uploadPhoto(result.assets[0].uri);
        
        if (uploadedUrl) {
          const newPhotos = [...photos, uploadedUrl];
          onPhotosChange(newPhotos);
        } else {
          const message = 'Failed to upload photo. Please try again.';
          if (Platform.OS === 'web') {
            alert(message);
          } else {
            Alert.alert('Upload Failed', message);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      const message = 'Error selecting image. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const showImagePickerModal = () => {
    if (photos.length >= maxPhotos) {
      const message = `You can upload a maximum of ${maxPhotos} photos.`;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Maximum Photos Reached', message);
      }
      return;
    }
    setShowImagePicker(true);
  };

  const renderPhotoSlot = (photo: string | null, index: number) => {
    if (photo) {
      return (
        <View key={index} style={styles.photoContainer}>
          <Image source={{ uri: photo }} style={styles.photo} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removePhoto(index)}
          >
            <MaterialIcons name="close" size={20} color={Colors.surface} />
          </TouchableOpacity>
          {index === 0 && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryText}>MAIN</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.emptySlot}
        onPress={showImagePickerModal}
        disabled={uploading}
      >
        {uploading && index === photos.length ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <>
            <MaterialIcons name="add-a-photo" size={32} color={Colors.textSecondary} />
            <Text style={styles.emptySlotText}>
              {index === 0 ? 'Add main photo' : 'Add photo'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>
      <Text style={styles.subtitle}>
        Add up to {maxPhotos} photos. Your first photo will be your main photo.
      </Text>
      
      <ScrollView 
        style={styles.photosContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photosGrid}>
          {Array.from({ length: maxPhotos }, (_, index) => 
            renderPhotoSlot(photos[index] || null, index)
          )}
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Photo</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImageSelection('camera')}
            >
              <MaterialIcons name="camera-alt" size={24} color={Colors.primary} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImageSelection('library')}
            >
              <MaterialIcons name="photo-library" size={24} color={Colors.primary} />
              <Text style={styles.modalOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  photosContainer: {
    maxHeight: 400,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 3/4,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  primaryText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptySlot: {
    width: '48%',
    aspectRatio: 3/4,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 16,
    fontWeight: '500',
  },
  modalCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});