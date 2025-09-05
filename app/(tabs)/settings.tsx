import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import CountrySelector from '@/components/ui/CountrySelector';
import AgeRangeSelector from '@/components/ui/AgeRangeSelector';
import { profileService } from '@/services/profileService';
import { FilterSettings } from '@/types/User';
import { Country } from '@/constants/Countries';
import { Colors, Gradients } from '@/constants/Colors';

export default function SettingsScreen() {
  const [filters, setFilters] = useState<FilterSettings>({
    ageRange: { min: 18, max: 35 },
    distance: 25,
    ethnicities: []
  });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadCurrentFilters();
  }, []);

  const loadCurrentFilters = async () => {
    try {
      const currentFilters = await profileService.getFilterSettings();
      setFilters(currentFilters);
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setInitialLoad(false);
    }
  };

  const saveFilters = async () => {
    setLoading(true);
    try {
      await profileService.updateFilterSettings(filters);
      const message = 'Discovery preferences saved successfully!';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Settings Saved', message);
      }
    } catch (error) {
      console.error('Error saving filters:', error);
      const message = 'Failed to save settings. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      ageRange: { min: 18, max: 50 },
      distance: 100,
      ethnicities: []
    });
  };

    const updateMinAge = (text: string) => {
    if (text === '') {
      setFilters(prev => ({
        ...prev,
        ageRange: { ...prev.ageRange, min: 18 }
      }));
      return;
    }
    const age = parseInt(text);
    if (!isNaN(age)) {
      const clampedAge = Math.max(18, Math.min(age, Math.min(filters.ageRange.max - 1, 65)));
      setFilters(prev => ({
        ...prev,
        ageRange: { ...prev.ageRange, min: clampedAge }
      }));
    }
  };

  const updateMaxAge = (text: string) => {
    if (text === '') {
      setFilters(prev => ({
        ...prev,
        ageRange: { ...prev.ageRange, max: 35 }
      }));
      return;
    }
    const age = parseInt(text);
    if (!isNaN(age)) {
      const clampedAge = Math.max(Math.max(filters.ageRange.min + 1, 18), Math.min(age, 65));
      setFilters(prev => ({
        ...prev,
        ageRange: { ...prev.ageRange, max: clampedAge }
      }));
    }
  };

  const updateDistance = (text: string) => {
    const distance = parseInt(text) || 25;
    const clampedDistance = Math.max(1, Math.min(distance, 100));
    setFilters(prev => ({ ...prev, distance: clampedDistance }));
  };

  if (initialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Gradients.background} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="settings" size={60} color={Colors.textLight} />
            <Text style={styles.loadingText}>Loading settings...</Text>
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
            <Text style={styles.headerTitle}>Discovery Preferences</Text>
            <Text style={styles.headerSubtitle}>
              Customize who appears in your discovery feed
            </Text>
          </View>

          <View style={styles.content}>
            {/* Age Range Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="cake" size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Age Range</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Show people aged {filters.ageRange.min} to {filters.ageRange.max} years old
              </Text>
              
              <AgeRangeSelector
                minAge={filters.ageRange.min}
                maxAge={filters.ageRange.max}
                onMinAgeChange={(age) => setFilters(prev => ({
                  ...prev,
                  ageRange: { ...prev.ageRange, min: age }
                }))}
                onMaxAgeChange={(age) => setFilters(prev => ({
                  ...prev,
                  ageRange: { ...prev.ageRange, max: age }
                }))}
              />
            </View>

            {/* Distance Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="location-on" size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Maximum Distance</Text>
              </View>
              <Text style={styles.sectionDescription}>
                {filters.distance === 100 
                  ? 'Show people within 100+ miles (no distance limit)' 
                  : `Show people within ${filters.distance} miles`
                }
              </Text>
              
              <View style={styles.distanceContainer}>
                <Text style={styles.inputLabel}>Distance (miles)</Text>
                <TextInput
                  style={styles.numberInput}
                  value={filters.distance.toString()}
                  onChangeText={updateDistance}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              
              <Text style={styles.helperText}>
                Set to 100 to see all profiles regardless of distance
              </Text>
            </View>

            {/* Ethnicity Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="public" size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Preferred Ethnicities</Text>
              </View>
              <Text style={styles.sectionDescription}>
                {filters.ethnicities.length === 0 
                  ? 'Show people of all ethnicities' 
                  : `Showing ${filters.ethnicities.length} selected ethnicities`
                }
              </Text>
              
              <CountrySelector
                selectedCountries={filters.ethnicities}
                onSelectionChange={(ethnicities) => 
                  setFilters(prev => ({ ...prev, ethnicities }))
                }
                placeholder="Select preferred ethnicities (optional)"
              />
              
              <Text style={styles.helperText}>
                Leave empty to see people of all ethnicities. Select specific countries to focus your discovery.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            <View style={styles.buttonContainer}>
              <Text 
                style={styles.resetButton}
                onPress={resetFilters}
              >
                Reset to Default
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <Text
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={saveFilters}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Text>
            </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  numberInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    minWidth: 80,
  },
  rangeSeparator: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 24,
  },
  distanceContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonContainer: {
    flex: 1,
  },
  resetButton: {
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});