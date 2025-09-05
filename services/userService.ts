// This service is now deprecated in favor of profileService
// Keeping for backward compatibility during migration
import { profileService } from './profileService';

export const userService = {
  getCurrentProfile: () => profileService.getCurrentProfile(),
  getCurrentUser: () => profileService.getCurrentProfile(), // Alias for backward compatibility
  getDiscoverableUsers: (filters?: any) => profileService.getDiscoverableProfiles(filters),
  updateProfile: (updates: any) => profileService.updateProfile(updates),
  createProfile: (profile: any) => profileService.createProfile(profile),
  deleteAccount: () => {
    // This will be handled by AuthContext
    console.warn('userService.deleteAccount is deprecated. Use AuthContext.deleteAccount instead.');
  },
  setCurrentUser: (userId: string) => {
    // This is no longer needed with real authentication
    console.warn('userService.setCurrentUser is deprecated. Authentication is handled by AuthContext.');
  }
};