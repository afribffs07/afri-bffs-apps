import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { profileService } from '@/services/profileService';
import { messageService } from '@/services/messageService';

interface NotificationCounts {
  likes: number;
  matches: number;
  messages: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    likes: 0,
    matches: 0,
    messages: 0
  });
  
  const updateInProgress = useRef(false);
  const lastUserId = useRef<string | null>(null);

  const getLastViewed = useCallback(async (type: 'likes' | 'matches' | 'messages'): Promise<string | null> => {
    if (!user) return null;
    try {
      return await AsyncStorage.getItem(`lastViewed_${type}_${user.id}`);
    } catch {
      return null;
    }
  }, [user?.id]);

  const setLastViewed = useCallback(async (type: 'likes' | 'matches' | 'messages') => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(`lastViewed_${type}_${user.id}`, new Date().toISOString());
    } catch (error) {
      console.error(`Error setting last viewed for ${type}:`, error);
    }
  }, [user?.id]);

  const updateCounts = useCallback(async () => {
    if (!user || updateInProgress.current) {
      if (!user) {
        setCounts({ likes: 0, matches: 0, messages: 0 });
      }
      return;
    }

    updateInProgress.current = true;
    
    try {
      const [lastViewedLikes, lastViewedMatches, lastViewedMessages] = await Promise.all([
        getLastViewed('likes'),
        getLastViewed('matches'),
        getLastViewed('messages')
      ]);

      let newLikesCount = 0;
      try {
        const likedProfiles = await profileService.getProfilesWhoLikedMe();
        if (lastViewedLikes) {
          newLikesCount = likedProfiles.length > 0 ? 1 : 0;
        } else {
          newLikesCount = likedProfiles.length;
        }
      } catch {
        newLikesCount = 0;
      }

      let newMatchesCount = 0;
      try {
        const matches = await messageService.getMatches();
        if (lastViewedMatches) {
          const lastViewed = new Date(lastViewedMatches);
          newMatchesCount = matches.filter(match => 
            new Date(match.createdAt) > lastViewed
          ).length;
        } else {
          newMatchesCount = matches.length;
        }
      } catch {
        newMatchesCount = 0;
      }

      let newMessagesCount = 0;
      try {
        const matches = await messageService.getMatches();
        if (lastViewedMessages) {
          const lastViewed = new Date(lastViewedMessages);
          newMessagesCount = matches.filter(match => 
            match.lastMessage && new Date(match.lastMessage.createdAt) > lastViewed && !match.lastMessage.isFromMe
          ).length;
        } else {
          newMessagesCount = matches.filter(match => 
            match.lastMessage && !match.lastMessage.isFromMe
          ).length;
        }
      } catch {
        newMessagesCount = 0;
      }

      const newCounts = {
        likes: newLikesCount,
        matches: newMatchesCount,
        messages: newMessagesCount
      };

      setCounts(prevCounts => {
        if (prevCounts.likes !== newCounts.likes || 
            prevCounts.matches !== newCounts.matches || 
            prevCounts.messages !== newCounts.messages) {
          return newCounts;
        }
        return prevCounts;
      });
    } catch (error) {
      console.error('Error updating notification counts:', error);
    } finally {
      updateInProgress.current = false;
    }
  }, [user?.id, getLastViewed]);

  useEffect(() => {
    if (user?.id !== lastUserId.current) {
      lastUserId.current = user?.id || null;
      updateCounts();
    }
  }, [user?.id, updateCounts]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(updateCounts, 60000);
    return () => clearInterval(interval);
  }, [user?.id, updateCounts]);

  const markAsViewed = useCallback(async (type: 'likes' | 'matches' | 'messages') => {
    await setLastViewed(type);
    setCounts(prev => ({ ...prev, [type]: 0 }));
  }, [setLastViewed]);

  return {
    counts,
    markAsViewed,
    updateCounts
  };
}