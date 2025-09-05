import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GlitterText from '@/components/ui/GlitterText';
import { Colors, Gradients } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons name="search-off" size={80} color={Colors.textLight} />
                                                                <GlitterText size={32}>Oops!</GlitterText>
        <Text style={styles.message}>This page could not be found.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  message: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});