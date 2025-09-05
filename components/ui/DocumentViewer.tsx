import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface DocumentViewerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export default function DocumentViewer({ visible, onClose, title, content }: DocumentViewerProps) {
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        // Main heading
        return (
          <Text key={index} style={styles.mainHeading}>
            {line.replace('# ', '')}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        // Section heading
        return (
          <Text key={index} style={styles.sectionHeading}>
            {line.replace('## ', '')}
          </Text>
        );
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        // Bullet point
        return (
          <Text key={index} style={styles.bulletPoint}>
            {line}
          </Text>
        );
      } else if (line.trim() === '') {
        // Empty line
        return <View key={index} style={styles.spacer} />;
      } else {
        // Regular text
        return (
          <Text key={index} style={styles.regularText}>
            {line}
          </Text>
        );
      }
    });
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="fullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          bounces={true}
          bouncesZoom={false}
          alwaysBounceVertical={true}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          overScrollMode="always"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10
          }}
          persistentScrollbar={true}
        >
          <View style={styles.contentWrapper}>
            {renderContent(content)}
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
            <Text style={styles.acceptButtonText}>I've Read This</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    backgroundColor: Colors.surface,
    ...Platform.select({
      android: {
        paddingTop: 20,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
    scrollContainer: {
    flex: 1,
    height: 10
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.select({
      android: 120, // Extra padding for Android devices
      ios: 60,
      default: 80,
    }),
    minHeight: Platform.select({
      android: '120%', // Ensure content extends beyond viewport on Android
      default: '100%',
    }),
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.select({
      android: 80, // Extra bottom padding for Android
      ios: 40,
      default: 60,
    }),
    flex: 1,
    minHeight: '100%',
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  regularText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 4,
    marginLeft: 8,
  },
  spacer: {
    height: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    ...Platform.select({
      android: {
        paddingBottom: 20,
      },
    }),
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});