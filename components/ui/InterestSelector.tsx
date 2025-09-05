
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface InterestSelectorProps {
  selectedInterests: string[];
  onSelectionChange: (interests: string[]) => void;
  maxSelections?: number;
}

const INTEREST_CATEGORIES = {
  'Hobbies & Activities': [
    'Photography', 'Reading', 'Writing', 'Painting', 'Drawing', 'Cooking', 'Baking',
    'Gardening', 'DIY Projects', 'Crafting', 'Knitting', 'Pottery', 'Jewelry Making'
  ],
  'Sports & Fitness': [
    'Gym Workouts', 'Running', 'Yoga', 'Pilates', 'Swimming', 'Cycling', 'Hiking',
    'Rock Climbing', 'Tennis', 'Basketball', 'Soccer', 'Volleyball', 'Boxing',
    'Martial Arts', 'Dancing', 'Zumba'
  ],
  'Music & Arts': [
    'Playing Guitar', 'Playing Piano', 'Singing', 'Music Production', 'Concerts',
    'Live Music', 'Opera', 'Theater', 'Museums', 'Art Galleries', 'Film & Movies',
    'Stand-up Comedy'
  ],
  'Food & Drink': [
    'Wine Tasting', 'Coffee Culture', 'Food Festivals', 'Trying New Restaurants',
    'Vegetarian/Vegan', 'International Cuisine', 'Cocktail Making', 'Brunch',
    'Food Blogging', 'Farmers Markets'
  ],
  'Travel & Adventure': [
    'Backpacking', 'Road Trips', 'Beach Vacations', 'Mountain Adventures',
    'City Exploration', 'Cultural Travel', 'Solo Travel', 'Group Travel',
    'Camping', 'Glamping', 'International Travel'
  ],
  'Technology & Gaming': [
    'Video Gaming', 'Board Games', 'Tech Gadgets', 'Coding', 'App Development',
    'Cryptocurrency', 'Virtual Reality', 'Streaming', 'Podcasts', 'Social Media'
  ],
  'Social & Lifestyle': [
    'Volunteering', 'Community Service', 'Networking Events', 'Book Clubs',
    'Wine Clubs', 'Meetup Groups', 'Karaoke', 'Trivia Nights', 'Game Nights',
    'Parties & Events', 'Fashion', 'Shopping'
  ],
  'Learning & Growth': [
    'Language Learning', 'Online Courses', 'Meditation', 'Mindfulness',
    'Self-Help', 'Philosophy', 'Psychology', 'History', 'Science',
    'Astronomy', 'Environmental Causes'
  ],
  'Professional & Business': [
    'Entrepreneurship', 'Investing', 'Real Estate', 'Marketing', 'Sales',
    'Public Speaking', 'Leadership', 'Mentoring', 'Consulting', 'Freelancing'
  ]
};

export default function InterestSelector({
  selectedInterests,
  onSelectionChange,
  maxSelections = 10
}: InterestSelectorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(INTEREST_CATEGORIES)[0]);

  const toggleInterest = (interest: string) => {
    const isSelected = selectedInterests.includes(interest);
    
    if (isSelected) {
      onSelectionChange(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < maxSelections) {
      onSelectionChange([...selectedInterests, interest]);
    }
  };

  const renderInterestTag = (interest: string, isInModal = false) => {
    const isSelected = selectedInterests.includes(interest);
    const canSelect = selectedInterests.length < maxSelections || isSelected;
    
    return (
      <TouchableOpacity
        key={interest}
        style={[
          styles.interestTag,
          isSelected && styles.selectedInterestTag,
          !canSelect && !isSelected && styles.disabledInterestTag
        ]}
        onPress={() => toggleInterest(interest)}
        disabled={!canSelect && !isSelected}
      >
        <Text style={[
          styles.interestText,
          isSelected && styles.selectedInterestText,
          !canSelect && !isSelected && styles.disabledInterestText
        ]}>
          {interest}
        </Text>
        {isSelected && (
          <MaterialIcons name="close" size={16} color={Colors.surface} style={styles.closeIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.selector} onPress={() => setIsVisible(true)}>
        <View style={styles.selectedContainer}>
          {selectedInterests.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.selectedScroll}
            >
              <View style={styles.selectedList}>
                {selectedInterests.map(interest => renderInterestTag(interest))}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.placeholder}>Select your interests ({maxSelections} max)</Text>
          )}
        </View>
        <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.helperText}>
        {selectedInterests.length}/{maxSelections} interests selected
      </Text>

      <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Interests</Text>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryTabs}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.keys(INTEREST_CATEGORIES).map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryTab,
                    activeCategory === category && styles.activeCategoryTab
                  ]}
                  onPress={() => setActiveCategory(category)}
                >
                  <Text style={[
                    styles.categoryTabText,
                    activeCategory === category && styles.activeCategoryTabText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.interestsGrid}>
            <View style={styles.interestsContainer}>
              {INTEREST_CATEGORIES[activeCategory as keyof typeof INTEREST_CATEGORIES].map(interest => 
                renderInterestTag(interest, true)
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>
              {selectedInterests.length}/{maxSelections} interests selected
            </Text>
          </View>
        </View>
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
  selectedScroll: {
    maxHeight: 80,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placeholder: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  selectedInterestTag: {
    backgroundColor: Colors.primary,
  },
  disabledInterestTag: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  interestText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  selectedInterestText: {
    color: Colors.surface,
  },
  disabledInterestText: {
    color: Colors.textLight,
  },
  closeIcon: {
    marginLeft: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  activeCategoryTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  interestsGrid: {
    flex: 1,
    padding: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
