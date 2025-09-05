import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSubscription } from '@/hooks/useSubscription';
import { Colors, Gradients } from '@/constants/Colors';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
  fallbackComponent?: React.ReactNode;
}

export default function SubscriptionGuard({ 
  children, 
  feature = 'premium feature',
  fallbackComponent 
}: SubscriptionGuardProps) {
  const { hasActiveSubscription, loading, createSubscription } = useSubscription();

  const handleUpgrade = async () => {
    try {
      await createSubscription();
    } catch (error) {
      const message = 'Failed to open subscription page. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  // Only show loading on initial load, not on periodic checks
  if (loading && hasActiveSubscription === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={40} color={Colors.textLight} />
        <Text style={styles.loadingText}>Checking subscription...</Text>
      </View>
    );
  }

  if (!hasActiveSubscription) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.primary} style={styles.premiumCard}>
          <MaterialIcons name="star" size={60} color={Colors.surface} />
          <Text style={styles.title}>Premium Required</Text>
          <Text style={styles.subtitle}>
            Upgrade to Afri-BFFs Premium to access {feature}
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade for $7.99/month</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  premiumCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 350,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.surface,
    marginTop: 16,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  upgradeButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});