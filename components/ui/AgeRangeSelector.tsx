import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface AgeRangeSelectorProps {
  minAge: number;
  maxAge: number;
  onMinAgeChange: (age: number) => void;
  onMaxAgeChange: (age: number) => void;
}

export default function AgeRangeSelector({
  minAge,
  maxAge,
  onMinAgeChange,
  onMaxAgeChange
}: AgeRangeSelectorProps) {
  
  const incrementMinAge = () => {
    const newAge = Math.min(minAge + 1, maxAge - 1, 65);
    onMinAgeChange(newAge);
  };

  const decrementMinAge = () => {
    const newAge = Math.max(minAge - 1, 18);
    onMinAgeChange(newAge);
  };

  const incrementMaxAge = () => {
    const newAge = Math.min(maxAge + 1, 65);
    onMaxAgeChange(newAge);
  };

  const decrementMaxAge = () => {
    const newAge = Math.max(maxAge - 1, minAge + 1, 18);
    onMaxAgeChange(newAge);
  };

  return (
    <View style={styles.container}>
      <View style={styles.ageGroup}>
        <Text style={styles.label}>Min Age</Text>
        <View style={styles.ageControl}>
          <TouchableOpacity 
            style={[styles.button, minAge <= 18 && styles.buttonDisabled]} 
            onPress={decrementMinAge}
            disabled={minAge <= 18}
          >
            <MaterialIcons name="remove" size={20} color={minAge <= 18 ? Colors.textLight : Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.ageDisplay}>
            <Text style={styles.ageText}>{minAge}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, minAge >= maxAge - 1 && styles.buttonDisabled]} 
            onPress={incrementMinAge}
            disabled={minAge >= maxAge - 1}
          >
            <MaterialIcons name="add" size={20} color={minAge >= maxAge - 1 ? Colors.textLight : Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.separator}>
        <Text style={styles.separatorText}>to</Text>
      </View>

      <View style={styles.ageGroup}>
        <Text style={styles.label}>Max Age</Text>
        <View style={styles.ageControl}>
          <TouchableOpacity 
            style={[styles.button, maxAge <= minAge + 1 && styles.buttonDisabled]} 
            onPress={decrementMaxAge}
            disabled={maxAge <= minAge + 1}
          >
            <MaterialIcons name="remove" size={20} color={maxAge <= minAge + 1 ? Colors.textLight : Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.ageDisplay}>
            <Text style={styles.ageText}>{maxAge}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, maxAge >= 65 && styles.buttonDisabled]} 
            onPress={incrementMaxAge}
            disabled={maxAge >= 65}
          >
            <MaterialIcons name="add" size={20} color={maxAge >= 65 ? Colors.textLight : Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ageGroup: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  ageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  ageDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 50,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  ageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  separator: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  separatorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});