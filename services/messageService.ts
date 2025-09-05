import { supabase } from './supabase';
import { Message } from '@/types/User';

class MessageService {
  // Send a message in a match
  async sendMessage(matchId: string, content: string): Promise<Message | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select(`
          *,
          sender:user_profiles(name, photos)
        `)
        .single();

      if (error) throw error;

      // Update match's last_message_at
      await supabase
        .from('matches')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', matchId);

      return this.transformToMessage(data);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a match
  async getMessages(matchId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles(name, photos)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.transformToMessage);
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(matchId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .neq('sender_id', user.id); // Don't mark own messages as read
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Subscribe to new messages for a match
  subscribeToMessages(matchId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles(name, photos)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(this.transformToMessage(data));
          }
        }
      )
      .subscribe();
  }

            // Get matches with last message info
  async getMatches(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      console.log('Fetching matches for user:', user.id);

      // Get active matches where user is involved
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsLast: true });

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        return [];
      }

      console.log('Found matches:', matches?.length || 0, 'matches');

      if (!matches || matches.length === 0) {
        console.log('No matches found for user');
        return [];
      }

      // Get user profiles for all matched users
      const otherUserIds = matches.map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      );

      console.log('Looking up profiles for user IDs:', otherUserIds);

      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name, photos')
        .in('id', otherUserIds);

      if (profilesError) {
        console.error('Error fetching match profiles:', profilesError);
        return [];
      }

      console.log('Found profiles:', profiles?.length || 0, 'profiles');

      // Get last messages for each match
      const matchIds = matches.map(match => match.id);
      
      let lastMessages = [];
      if (matchIds.length > 0) {
        // Get the most recent message for each match
        const { data: allMessages, error: messagesError } = await supabase
          .from('messages')
          .select('match_id, content, created_at, sender_id')
          .in('match_id', matchIds)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('Error fetching last messages:', messagesError);
        } else {
          // Get only the most recent message per match
          const messagesByMatch: { [key: string]: any } = {};
          allMessages?.forEach(message => {
            if (!messagesByMatch[message.match_id]) {
              messagesByMatch[message.match_id] = message;
            }
          });
          lastMessages = Object.values(messagesByMatch);
        }
      }

      // Combine data and ensure unique matches
      const result = matches
        .map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const otherUser = profiles?.find(p => p.id === otherUserId);
          const lastMessage = lastMessages?.find(m => m.match_id === match.id);
          
          return {
            id: match.id,
            user: otherUser,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              createdAt: lastMessage.created_at,
              isFromMe: lastMessage.sender_id === user.id
            } : null,
            createdAt: match.created_at,
          };
        })
        .filter(match => {
          // Only include matches with valid user data
          return match.user && match.user.id && match.user.name;
        });

      console.log('Final processed matches:', result.length, 'valid matches');
      return result;
    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }

  private transformToMessage(data: any): Message {
    return {
      id: data.id,
      matchId: data.match_id,
      senderId: data.sender_id,
      content: data.content,
      createdAt: data.created_at,
      isRead: data.is_read,
      senderName: data.sender?.name,
      senderPhoto: data.sender?.photos?.[0],
    };
  }
}

export const messageService = new MessageService();