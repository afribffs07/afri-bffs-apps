import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import CountrySelector from '@/components/ui/CountrySelector';
import PhotoUploader from '@/components/ui/PhotoUploader';
import InterestSelector from '@/components/ui/InterestSelector';
import GlitterText from '@/components/ui/GlitterText';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/User';
import { Country } from '@/constants/Countries';
import { Colors, Gradients } from '@/constants/Colors';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [selectedEthnicities, setSelectedEthnicities] = useState<Country[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    loadCurrentUserProfile();
    if (!isEditing) {
      requestLocationPermission();
    }
  }, []);

  const loadCurrentUserProfile = async () => {
    try {
      const currentProfile = await userService.getCurrentProfile();
      if (currentProfile) {
        setIsEditing(true);
        setName(currentProfile.name || '');
        setAge(currentProfile.age ? String(currentProfile.age) : '');
        setBio(currentProfile.bio || '');
        setSelectedEthnicities(currentProfile.ethnicities || []);
        setPhotos(currentProfile.photos || []);
        setSelectedInterests(currentProfile.interests || []);
        setLocation(currentProfile.location || null);
      }
    } catch (error) {
      console.error('Error loading current profile:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const message = 'Location permission is needed to find friends near you';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Location Permission', message);
        }
        // Set default location (NYC) if permission denied
        setLocation({
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          state: 'NY'
        });
        return;
      }
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocation({
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        state: 'NY'
      });
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        city: geocode.city || 'Unknown City',
        state: geocode.region || 'Unknown State',
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      // Fallback to NYC
      setLocation({
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        state: 'NY'
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const trimmedName = name.trim();
    const trimmedBio = bio.trim();
    const ageNumber = parseInt(age.trim());

    if (!trimmedName || !age.trim() || !trimmedBio || selectedEthnicities.length === 0 || photos.length === 0 || selectedInterests.length === 0 || !location) {
      const alertMessage = 'Please fill in all fields, add at least one photo, select at least one ethnicity, choose your interests, and allow location access.';
      
      if (Platform.OS === 'web') {
        alert(alertMessage);
      } else {
        Alert.alert('Incomplete Profile', alertMessage);
      }
      return;
    }

    if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 100) {
      const alertMessage = 'Please enter a valid age between 18 and 100.';
      
      if (Platform.OS === 'web') {
        alert(alertMessage);
      } else {
        Alert.alert('Invalid Age', alertMessage);
      }
      return;
    }

    try {
      if (isEditing) {
        await userService.updateProfile({
          name: trimmedName,
          age: ageNumber,
          bio: trimmedBio,
          ethnicities: selectedEthnicities,
          photos: photos,
          interests: selectedInterests,
          location: location,
        });
      } else {
        await userService.createProfile({
          name: trimmedName,
          age: ageNumber,
          bio: trimmedBio,
          photos: photos,
          location: location,
          ethnicities: selectedEthnicities,
          interests: selectedInterests,
          isDiscoverable: true,
          isPremium: false,
          lastActive: new Date().toISOString(),
        });
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save profile:', error);
      const alertMessage = 'Failed to save profile. Please try again.';
      
      if (Platform.OS === 'web') {
        alert(alertMessage);
      } else {
        Alert.alert('Error', alertMessage);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <GlitterText size={28}>
              {isEditing ? 'Edit Profile' : 'Create Your Profile'}
            </GlitterText>
            <Text style={styles.subtitle}>
              {isEditing 
                ? 'Update your information' 
                : 'Tell us about yourself to find amazing friends!'
              }
            </Text>
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
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell others about yourself, your interests, and what kind of friends you are looking for..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <PhotoUploader
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={6}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ethnicities</Text>
              <CountrySelector
                selectedCountries={selectedEthnicities}
                onSelectionChange={setSelectedEthnicities}
                placeholder="Select your ethnicities"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Interests</Text>
              <InterestSelector
                selectedInterests={selectedInterests}
                onSelectionChange={setSelectedInterests}
                maxSelections={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.locationContainer}>
                {location ? (
                  <View style={styles.locationInfo}>
                    <MaterialIcons name="location-on" size={20} color={Colors.primary} />
                    <Text style={styles.locationText}>
                      {`${location.city || 'Unknown City'}, ${location.state || 'Unknown State'}`}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.locationPlaceholder}>Getting location...</Text>
                )}
                <TouchableOpacity 
                  style={styles.refreshLocationButton}
                  onPress={getCurrentLocation}
                  disabled={locationLoading}
                >
                  <MaterialIcons 
                    name="refresh" 
                    size={20} 
                    color={locationLoading ? Colors.textLight : Colors.primary} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Your location helps us find friends nearby. We use your city and state, not your exact address.
              </Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Save Changes' : 'Create Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginBottom: 24,
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
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
  },
  locationPlaceholder: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  refreshLocationButton: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
});