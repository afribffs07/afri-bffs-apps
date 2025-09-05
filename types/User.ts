import { Country } from '@/constants/Countries';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  };
  ethnicities: Country[];
  interests: string[];
  isDiscoverable: boolean;
  isPremium: boolean;
  createdAt: string;
  lastActive: string;
  distance?: number;
}

export interface Match {
  id: string;
  users: [string, string];
  createdAt: string;
  lastMessageAt?: string;
  isActive: boolean;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface FilterSettings {
  ageRange: {
    min: number;
    max: number;
  };
  distance: number;
  ethnicities: string[];
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderName?: string;
  senderPhoto?: string;
}