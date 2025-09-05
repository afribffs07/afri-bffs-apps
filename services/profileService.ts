import { supabase } from './supabase';
import { UserProfile, FilterSettings } from '@/types/User';
import { Country } from '@/constants/Countries';

class ProfileService {
    // Get current user's profile
  async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows gracefully

      if (error) {
        console.error('Error fetching current profile:', error);
        return null;
      }

      // Return null if no profile found (user just signed up)
      if (!data) {
        console.log('No profile found for user, they may need to complete setup');
        return null;
      }

      return this.transformToUserProfile(data);
    } catch (error) {
      console.error('Error in getCurrentProfile:', error);
      return null;
    }
  }

  // Get discoverable profiles with advanced filtering
  async getDiscoverableProfiles(filters?: FilterSettings): Promise<UserProfile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get current user's location for distance calculation
      const currentProfile = await this.getCurrentProfile();
      if (!currentProfile) return [];

      let query = supabase
        .from('user_profiles')
        .select('*')
        .eq('is_discoverable', true)
        .neq('id', user.id)
        .order('last_active', { ascending: false });

      // Apply age filter
      if (filters?.ageRange) {
        query = query
          .gte('age', filters.ageRange.min)
          .lte('age', filters.ageRange.max);
      }

      const { data: allProfiles, error } = await query;

      if (error) {
        console.error('Error fetching discoverable profiles:', error);
        return [];
      }

      let profiles = (allProfiles || []).map(this.transformToUserProfile);

      // Apply ethnicity filter
      if (filters?.ethnicities && filters.ethnicities.length > 0) {
        profiles = profiles.filter(profile => {
          return profile.ethnicities.some(ethnicity => 
            filters.ethnicities!.some(filterEth => filterEth.code === ethnicity.code)
          );
        });
      }

      // Apply distance filter and fallback logic
      if (filters?.distance && currentProfile.location) {
        const profilesWithDistance = profiles.map(profile => ({
          ...profile,
          distance: this.calculateDistance(
            currentProfile.location.latitude,
            currentProfile.location.longitude,
            profile.location.latitude,
            profile.location.longitude
          )
        }));

        // First, try to get profiles within the specified distance
        const profilesInRange = profilesWithDistance.filter(
          profile => profile.distance <= filters.distance
        );

        // If we have profiles in range, use them; otherwise, show all profiles
        if (profilesInRange.length > 0) {
          profiles = profilesInRange.sort((a, b) => a.distance - b.distance);
        } else {
          // No profiles in range, show all profiles sorted by distance
          profiles = profilesWithDistance.sort((a, b) => a.distance - b.distance);
        }
      }

      // Remove already liked profiles
      const likedProfiles = await this.getLikedProfileIds();
      profiles = profiles.filter(profile => !likedProfiles.includes(profile.id));

      return profiles.slice(0, 20); // Limit to 20 profiles
    } catch (error) {
      console.error('Error in getDiscoverableProfiles:', error);
      return [];
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get list of profile IDs that the current user has already liked
  private async getLikedProfileIds(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', user.id);

      if (error) return [];
      return (data || []).map(like => like.to_user_id);
    } catch (error) {
      return [];
    }
  }

      // Update profile
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Map camelCase to snake_case for database
      const updatePayload: any = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Map each field properly
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.age !== undefined) updatePayload.age = updates.age;
      if (updates.bio !== undefined) updatePayload.bio = updates.bio;
      if (updates.photos !== undefined) updatePayload.photos = updates.photos;
      if (updates.location !== undefined) updatePayload.location = updates.location;
      if (updates.ethnicities !== undefined) updatePayload.ethnicities = updates.ethnicities;
      if (updates.interests !== undefined) updatePayload.interests = updates.interests;
      if (updates.isDiscoverable !== undefined) updatePayload.is_discoverable = updates.isDiscoverable;
      if (updates.isPremium !== undefined) updatePayload.is_premium = updates.isPremium;
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return this.transformToUserProfile(data);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }

        // Create initial profile
  async createProfile(profileData: Omit<UserProfile, 'id' | 'createdAt'>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const profilePayload = {
        id: user.id, // Explicitly set the ID
        name: profileData.name,
        age: profileData.age,
        bio: profileData.bio,
        photos: profileData.photos,
        location: profileData.location,
        ethnicities: profileData.ethnicities,
        interests: profileData.interests,
        is_discoverable: profileData.isDiscoverable, // Map camelCase to snake_case
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profilePayload, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      return this.transformToUserProfile(data);
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  }

      // Like a profile
  async likeProfile(targetUserId: string): Promise<{ isMatch: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      console.log('Liking profile:', { fromUser: user.id, toUser: targetUserId });

      // Insert like (ignore if already exists)
      const { error: likeError } = await supabase
        .from('likes')
        .upsert({
          from_user_id: user.id,
          to_user_id: targetUserId,
        }, {
          onConflict: 'from_user_id,to_user_id',
          ignoreDuplicates: true
        });

      if (likeError) {
        console.error('Error inserting like:', likeError);
        throw likeError;
      }

      // Check if it's a match (both users liked each other)
      const { data: existingLike, error: matchCheckError } = await supabase
        .from('likes')
        .select('*')
        .eq('from_user_id', targetUserId)
        .eq('to_user_id', user.id)
        .maybeSingle();

      if (matchCheckError) {
        console.error('Error checking for match:', matchCheckError);
      }

      const isMatch = !!existingLike;
      console.log('Match check result:', { isMatch, existingLike });

      // If it's a match, create match record
      if (isMatch) {
        // Always put the smaller user ID first for consistency
        const matchData = {
          user1_id: user.id < targetUserId ? user.id : targetUserId,
          user2_id: user.id < targetUserId ? targetUserId : user.id,
          is_active: true,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        };

        console.log('Creating match:', matchData);

        const { data: matchResult, error: matchError } = await supabase
          .from('matches')
          .upsert(matchData, {
            onConflict: 'user1_id,user2_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (matchError) {
          console.error('Error creating match:', matchError);
          // Don't throw error, still return match status
        } else {
          console.log('Match created successfully:', matchResult);
        }
      }

      return { isMatch };
    } catch (error) {
      console.error('Error liking profile:', error);
      throw error;
    }
  }

    // Get profiles that liked the current user (Premium feature)
  async getProfilesWhoLikedMe(): Promise<UserProfile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      console.log('Fetching profiles who liked me for user:', user.id);

      // First get the likes
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('from_user_id')
        .eq('to_user_id', user.id);

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        return [];
      }

      console.log('Found likes:', likes);

      if (!likes || likes.length === 0) {
        return [];
      }

      // Get the user profiles for those who liked me
      const userIds = likes.map(like => like.from_user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      console.log('Found profiles who liked me:', profiles);

      return (profiles || [])
        .map(profile => this.transformToUserProfile(profile))
        .filter(profile => profile !== null);
    } catch (error) {
      console.error('Error in getProfilesWhoLikedMe:', error);
      return [];
    }
  }

  // Get user's filter settings
  async getFilterSettings(): Promise<FilterSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { ageRange: { min: 18, max: 35 }, distance: 25, ethnicities: [] };
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return { ageRange: { min: 18, max: 35 }, distance: 25, ethnicities: [] };
      }

      return {
        ageRange: {
          min: data.age_range_min,
          max: data.age_range_max,
        },
        distance: data.max_distance,
        ethnicities: data.ethnicity_filters || [],
      };
    } catch (error) {
      console.error('Error getting filter settings:', error);
      return { ageRange: { min: 18, max: 35 }, distance: 25, ethnicities: [] };
    }
  }

  // Update user's filter settings
  async updateFilterSettings(filters: FilterSettings): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          age_range_min: filters.ageRange.min,
          age_range_max: filters.ageRange.max,
          max_distance: filters.distance,
          ethnicity_filters: filters.ethnicities,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating filter settings:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateFilterSettings:', error);
      throw error;
    }
  }

  // Transform database row to UserProfile type
  private transformToUserProfile(data: any): UserProfile {
    return {
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
  }
}

export const profileService = new ProfileService();