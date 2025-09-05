import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface PhotoCarouselProps {
  photos: string[];
  style?: any;
  onPhotoPress?: (photoUrl: string, index: number) => void;
  hideArrows?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function PhotoCarousel({ photos, style, onPhotoPress, hideArrows = false }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholderContainer}>
          <MaterialIcons name="person" size={80} color={Colors.textLight} />
        </View>
      </View>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
  };

  const handlePhotoPress = () => {
    if (onPhotoPress) {
      onPhotoPress(photos[currentIndex], currentIndex);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.photoTouchable}
        onPress={handlePhotoPress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: photos[currentIndex] }}
          style={styles.image}
          contentFit="cover"
        />
      </TouchableOpacity>
      
      {photos.length > 1 && !hideArrows && (
        <>
          {/* Navigation Arrows - Made bigger */}
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.leftArrow} onPress={goToPrevious}>
              <MaterialIcons name="chevron-left" size={40} color={Colors.surface} />
            </TouchableOpacity>
          )}
          
          {currentIndex < photos.length - 1 && (
            <TouchableOpacity style={styles.rightArrow} onPress={goToNext}>
              <MaterialIcons name="chevron-right" size={40} color={Colors.surface} />
            </TouchableOpacity>
          )}
        </>
      )}
      
      {/* Photo Indicators */}
      {photos.length > 1 && (
        <View style={styles.indicators}>
                    {photos.map((photo, index) => (
            <TouchableOpacity
              key={`photo-indicator-${index}-${photo?.substring?.(photo.length - 10) || index}`}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator
              ]}
              onPress={() => setCurrentIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  photoTouchable: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  leftArrow: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicators: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: Colors.surface,
  },
});