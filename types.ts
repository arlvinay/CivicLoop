export enum AppView {
  LOGIN = 'LOGIN',
  SETUP = 'SETUP',
  HOME = 'HOME',
  COLLECTION = 'COLLECTION',
  SYNC = 'SYNC',
  SCANNER = 'SCANNER',
  BREAKDOWN = 'BREAKDOWN',
  COPILOT = 'COPILOT'
}

export enum CollectionStatus {
  SEGREGATED = 'segregated',
  MIXED = 'mixed',
  REJECTED = 'rejected',
  LOCKED = 'locked' // e.g., house closed
}

export enum UserRole {
  DRIVER = 'Driver',
  HELPER = 'Helper'
}

export interface UserProfile {
  authToken?: string;
  phoneNumber?: string;
  role?: UserRole;
  wardId?: string;
  isProfileSetup: boolean;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface CollectionRecord {
  collection_id: string; // UUID
  driver_id: string;
  household_id: string; // QR Payload mock
  status: CollectionStatus;
  timestamp: string; // ISO8601
  gps: GeoLocation;
  is_synced: boolean;
  image_url?: string; // Optional local URL for display
}

export interface BreakdownRecord {
  id: string;
  driver_id: string;
  timestamp: string;
  details: string;
  gps: GeoLocation;
  image_url?: string;
  is_synced: boolean;
}

export const MOCK_DRIVER_ID = "DRV-101";