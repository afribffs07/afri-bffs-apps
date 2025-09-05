import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CountrySelector from './CountrySelector';
import AgeRangeSelector from './AgeRangeSelector';
import { profileService } from '@/services/profileService';
import { FilterSettings } from '@/types/User';
import { Country } from '@/constants/Countries';
import { Colors } from '@/constants/Colors';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterSettings) => void;
}

export default function FilterModal({ visible, onClose, onApplyFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterSettings>({
    ageRange: { min: 18, max: 35 },
    distance: 25,
    ethnicities: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCurrentFilters();
    }
  }, [visible]);

  const loadCurrentFilters = async () => {
    try {
      const currentFilters = await profileService.getFilterSettings();
      setFilters(currentFilters);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    try {
      await profileService.updateFilterSettings(filters);
      onApplyFilters(filters);
      onClose();
    } catch (error) {
      console.error('Error applying filters:', error);
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Discovery Filters</Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Age Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Age Range</Text>
            <Text style={styles.sectionSubtitle}>
              {filters.ageRange.min} - {filters.ageRange.max} years old
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

          {/* Distance Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Maximum Distance</Text>
            <Text style={styles.sectionSubtitle}>
              {filters.distance === 100 ? '100+ miles' : `${filters.distance} miles`}
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

          {/* Ethnicity Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Preferred Ethnicities</Text>
            <Text style={styles.sectionSubtitle}>
              {filters.ethnicities.length === 0 
                ? 'Show all ethnicities' 
                : `${filters.ethnicities.length} selected`
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyButton, loading && styles.applyButtonDisabled]}
            onPress={handleApplyFilters}
            disabled={loading}
          >
            <Text style={styles.applyButtonText}>
              {loading ? 'Applying...' : 'Apply Filters'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  resetText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputContainer: {
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
    backgroundColor: Colors.surface,
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
    marginTop: 8,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});