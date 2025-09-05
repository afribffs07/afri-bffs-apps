import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  BackHandler,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COUNTRIES, Country } from '@/constants/Countries';
import { Colors } from '@/constants/Colors';

interface CountrySelectorProps {
  selectedCountries: Country[];
  onSelectionChange: (countries: Country[]) => void;
  placeholder?: string;
}

const { height: screenHeight } = Dimensions.get('window');

export default function CountrySelector({
  selectedCountries,
  onSelectionChange,
  placeholder = 'Select ethnicities'
}: CountrySelectorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCountry = (country: Country) => {
    const isSelected = selectedCountries.some(c => c.code === country.code);
    
    if (isSelected) {
      onSelectionChange(selectedCountries.filter(c => c.code !== country.code));
    } else {
      onSelectionChange([...selectedCountries, country]);
    }
  };

  const handleCloseModal = () => {
    setIsVisible(false);
    setSearchQuery('');
  };

  const handleOpenModal = () => {
    setIsVisible(true);
  };

  // Handle Android back button - CRITICAL for preventing stuck users
  React.useEffect(() => {
    if (Platform.OS === 'android' && isVisible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleCloseModal();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [isVisible]);

  // Auto-close modal if user somehow gets stuck (safety net)
  React.useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => {
        console.warn('CountrySelector: Auto-closing modal after 60 seconds to prevent stuck state');
      }, 60000);
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.selector} 
        onPress={handleOpenModal}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel="Select ethnicities"
        accessibilityRole="button"
      >
        <View style={styles.selectedContainer}>
          {selectedCountries.length > 0 ? (
            <View style={styles.selectedList}>
              {selectedCountries.map((country, index) => (
                <View key={`${country.code}-${index}`} style={styles.selectedTag}>
                  <Text style={styles.selectedFlag}>{country.flag}</Text>
                  <Text style={styles.selectedText}>{country.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal 
        visible={isVisible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
        supportedOrientations={['portrait']}
        {...(Platform.OS === 'android' && {
          hardwareAccelerated: true,
          statusBarTranslucent: false,
        })}
      >
        <View style={styles.modalContainer}>
          {/* Fixed Header - Always Accessible */}
          <View style={styles.fixedHeader}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                onPress={handleCloseModal}
                style={styles.headerButton}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <MaterialIcons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>Select Ethnicities</Text>
              
              <TouchableOpacity 
                onPress={handleCloseModal}
                style={styles.headerButton}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityLabel="Done"
                accessibilityRole="button"
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="words"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <MaterialIcons name="clear" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            bounces={true}
            scrollEventThrottle={16}
          >
            {filteredCountries.map((country) => {
              const isSelected = selectedCountries.some(c => c.code === country.code);
              
              return (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryRow,
                    isSelected && styles.countryRowSelected
                  ]}
                  onPress={() => toggleCountry(country)}
                  activeOpacity={0.6}
                  accessible={true}
                  accessibilityLabel={`${country.name} ${isSelected ? 'selected' : 'not selected'}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={styles.countryContent}>
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={[
                      styles.countryName, 
                      isSelected && styles.countryNameSelected
                    ]}>
                      {country.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
            
            {/* Extra space at bottom */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Fail-safe close button at bottom */}
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              onPress={handleCloseModal}
              style={styles.bottomCloseButton}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Text style={styles.bottomCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency overlay tap to close - Android fail-safe */}
        {Platform.OS === 'android' && (
          <TouchableOpacity
            style={styles.emergencyOverlay}
            onPress={handleCloseModal}
            activeOpacity={1}
            accessible={false}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 50,
  },
  selectedContainer: {
    flex: 1,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedFlag: {
    fontSize: 14,
    marginRight: 4,
  },
  selectedText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  placeholder: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fixedHeader: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 16,
    ...Platform.select({
      android: {
        elevation: 4,
        paddingTop: 20,
      },
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 56,
  },
  headerButton: {
    padding: 8,
    minWidth: 56,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  countryRowSelected: {
    backgroundColor: Colors.secondary,
  },
  countryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  countryName: {
    fontSize: 18,
    color: Colors.text,
    flex: 1,
  },
  countryNameSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...Platform.select({
      android: {
        paddingBottom: 20,
      },
    }),
  },
  bottomCloseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 52,
  },
  bottomCloseText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: -1,
  },
});