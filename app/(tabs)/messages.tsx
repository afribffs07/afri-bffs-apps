import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import SubscriptionGuard from '@/components/ui/SubscriptionGuard';
import ProfileViewModal from '@/components/ui/ProfileViewModal';
import { messageService } from '@/services/messageService';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useSubscription } from '@/hooks/useSubscription';
import { Message, UserProfile } from '@/types/User';
import { Colors, Gradients } from '@/constants/Colors';
import { supabase } from '@/services/supabase';

export default function MessagesScreen() {
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const { user } = useAuth();
  const { markAsViewed } = useNotifications();
  const { hasActiveSubscription } = useSubscription();
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Mark messages as viewed when page loads
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        markAsViewed('messages');
      }, 500);
    }
  }, [user, markAsViewed]);

  useEffect(() => {
    if (matchId) {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        setSelectedMatch(match);
        loadMessages(matchId);
      }
    }
  }, [matchId, matches]);

  useEffect(() => {
    if (selectedMatch) {
      loadMessages(selectedMatch.id);
      
      // Subscribe to new messages
      const subscription = messageService.subscribeToMessages(selectedMatch.id, (message) => {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, message];
        });
      });

      // Mark messages as read
      messageService.markMessagesAsRead(selectedMatch.id);

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedMatch]);

  const loadMatches = async () => {
    try {
      const matchData = await messageService.getMatches();
      setMatches(matchData);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const messageData = await messageService.getMessages(id);
      // Deduplicate messages by ID and timestamp
      const uniqueMessages = messageData.filter((message, index, arr) => 
        arr.findIndex(m => m.id === message.id) === index
      );
      setMessages(uniqueMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch || sending) return;

    setSending(true);
    try {
      console.log('Sending message:', newMessage.trim(), 'to match:', selectedMatch.id);
      const message = await messageService.sendMessage(selectedMatch.id, newMessage.trim());
      console.log('Message sent:', message);
      if (message) {
        setMessages(prev => {
          // Check if message already exists
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, message];
        });
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const message = 'Failed to send message. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setSending(false);
    }
  };

  const loadFullProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const profile: UserProfile = {
        id: data.id,
        name: data.name,
        age: data.age,
        bio: data.bio || '',
        photos: data.photos || [],
        location: data.location || {
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          state: 'NY'
        },
        ethnicities: data.ethnicities || [],
        interests: data.interests || [],
        isDiscoverable: data.is_discoverable,
        isPremium: data.is_premium,
        createdAt: data.created_at,
        lastActive: data.last_active,
      };

      setSelectedProfile(profile);
    } catch (error) {
      console.error('Error loading full profile:', error);
    }
  };

  const handleUnmatch = async () => {
    if (!selectedMatch) return;

    const alertTitle = 'Unmatch';
    const alertMessage = `Are you sure you want to unmatch with ${selectedMatch.user.name}? This action cannot be undone and you will no longer be able to message each other.`;
    
    if (Platform.OS === 'web') {
      if (confirm(`${alertTitle}\n\n${alertMessage}`)) {
        await performUnmatch();
      }
    } else {
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unmatch', style: 'destructive', onPress: () => performUnmatch() }
        ]
      );
    }
    setShowOptionsMenu(false);
  };

  const performUnmatch = async () => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ is_active: false })
        .eq('id', selectedMatch.id);

      if (error) throw error;

      // Go back to matches list
      setSelectedMatch(null);
      setMessages([]);
      
      // Remove from local state
      setMatches(prev => prev.filter(match => match.id !== selectedMatch.id));

      const message = 'Successfully unmatched';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Unmatched', message);
      }
    } catch (error) {
      console.error('Error unmatching:', error);
      const message = 'Failed to unmatch. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const renderMatch = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.matchItem,
        selectedMatch?.id === item.id && styles.selectedMatchItem
      ]}
      onPress={() => setSelectedMatch(item)}
    >
      <TouchableOpacity onPress={() => loadFullProfile(item.user.id)}>
        <Image
          source={{ uri: item.user.photos[0] }}
          style={styles.matchAvatar}
          contentFit="cover"
        />
      </TouchableOpacity>
      <View style={styles.matchInfo}>
        <TouchableOpacity onPress={() => loadFullProfile(item.user.id)}>
          <Text style={styles.matchName}>{item.user.name}</Text>
        </TouchableOpacity>
        {item.lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.isFromMe ? 'You: ' : ''}{item.lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.noMessages}>Say hello! 👋</Text>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    messages.forEach(message => {
      const messageDate = new Date(message.createdAt);
      const dateKey = messageDate.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    // Convert to flat array with date headers
    const flatData: (Message | { type: 'dateHeader'; date: string; displayDate: string })[] = [];
    
    Object.keys(groups)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(dateKey => {
        const messageDate = new Date(dateKey);
        let displayDate: string;

        if (messageDate.toDateString() === today.toDateString()) {
          displayDate = 'Today';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
          displayDate = 'Yesterday';
        } else {
          displayDate = messageDate.toLocaleDateString([], { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }

        // Add date header
        flatData.push({
          type: 'dateHeader',
          date: dateKey,
          displayDate
        });

        // Add messages for this date
        groups[dateKey]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .forEach(message => flatData.push(message));
      });

    return flatData;
  };

  const messagesWithHeaders = groupMessagesByDate(messages);

  const renderItem = ({ item }: { item: Message | { type: 'dateHeader'; date: string; displayDate: string } }) => {
    if ('type' in item && item.type === 'dateHeader') {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{item.displayDate}</Text>
        </View>
      );
    }

    const message = item as Message;
    const isMe = message.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMe ? styles.myMessageText : styles.theirMessageText
        ]}>
          {message.content}
        </Text>
        <Text style={[
          styles.messageTime,
          isMe ? styles.myMessageTime : styles.theirMessageTime
        ]}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Gradients.background} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="chat-bubble-outline" size={60} color={Colors.textLight} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        <SubscriptionGuard feature="messaging">
          <View style={styles.content}>
            {selectedMatch ? (
              <KeyboardAvoidingView 
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
              >
                <View style={styles.chatHeader}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => setSelectedMatch(null)}
                  >
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => loadFullProfile(selectedMatch.user.id)}>
                    <Image
                      source={{ uri: selectedMatch.user.photos[0] }}
                      style={styles.chatAvatar}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.chatNameContainer}
                    onPress={() => loadFullProfile(selectedMatch.user.id)}
                  >
                    <Text style={styles.chatName}>{selectedMatch.user.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.optionsButton}
                    onPress={() => setShowOptionsMenu(true)}
                  >
                    <MaterialIcons name="more-vert" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={messagesWithHeaders}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => {
                    if ('type' in item && item.type === 'dateHeader') {
                      return `date-header-${item.date}`;
                    }
                    const message = item as Message;
                    return `message-${message.id || `${index}-${message.senderId}-${message.createdAt}`}`;
                  }}
                  style={styles.messagesList}
                  contentContainerStyle={[
                    styles.messagesContent,
                    { paddingBottom: keyboardHeight > 0 ? 20 : 80 }
                  ]}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => {
                    // Auto scroll to bottom when new messages arrive
                    if (messages.length > 0) {
                      setTimeout(() => {
                        // Small delay to ensure proper scrolling
                      }, 100);
                    }
                  }}
                />

                <View style={[
                  styles.inputContainer,
                  keyboardHeight > 0 && Platform.OS === 'android' && {
                    marginBottom: keyboardHeight - 50
                  }
                ]}>
                  <TextInput
                    style={styles.messageInput}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                    maxLength={500}
                    returnKeyType="send"
                    onSubmitEditing={sendMessage}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    <MaterialIcons 
                      name="send" 
                      size={24} 
                      color={newMessage.trim() && !sending ? Colors.surface : Colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Options Menu Modal */}
                <Modal
                  visible={showOptionsMenu}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowOptionsMenu(false)}
                >
                  <TouchableOpacity 
                    style={styles.optionsModalBackground}
                    activeOpacity={1}
                    onPress={() => setShowOptionsMenu(false)}
                  >
                    <View style={styles.optionsMenu}>
                      <TouchableOpacity 
                        style={styles.optionsMenuItem}
                        onPress={handleUnmatch}
                      >
                        <MaterialIcons name="person-remove" size={24} color={Colors.error} />
                        <Text style={styles.optionsMenuText}>Unmatch</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </KeyboardAvoidingView>
            ) : (
              <View style={styles.matchesContainer}>
                {matches.length > 0 ? (
                  <FlatList
                    data={matches}
                    renderItem={renderMatch}
                    keyExtractor={(item, index) => `match-${item.id || index}`}
                    style={styles.matchesList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="chat-bubble-outline" size={80} color={Colors.textLight} />
                    <Text style={styles.emptyTitle}>No Matches Yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Start swiping to find your new best friends! When you match with someone, you can chat here.
                    </Text>
                    <TouchableOpacity
                      style={styles.discoverButton}
                      onPress={() => router.push('/(tabs)')}
                    >
                      <Text style={styles.discoverButtonText}>Start Discovering</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </SubscriptionGuard>

        <ProfileViewModal
          visible={selectedProfile !== null}
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
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
  content: {
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
  matchesContainer: {
    flex: 1,
  },
  matchesList: {
    flex: 1,
    paddingTop: 10,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  selectedMatchItem: {
    backgroundColor: Colors.secondary,
  },
  matchAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  noMessages: {
    fontSize: 14,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatNameContainer: {
    flex: 1,
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  optionsButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  messagesList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.surface,
  },
  theirMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.surface,
    opacity: 0.8,
    textAlign: 'right',
  },
  theirMessageTime: {
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    backgroundColor: Colors.background,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  discoverButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  discoverButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  optionsModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 140 : 120,
    paddingRight: 20,
  },
  optionsMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionsMenuText: {
    fontSize: 16,
    color: Colors.error,
    marginLeft: 12,
    fontWeight: '500',
  },
});