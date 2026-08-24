export type UserRole = 'girl' | 'owner' | 'admin';

export interface User {
  uid: string;
  role: UserRole;
  phone: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  college?: string;
  workplace?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  businessName?: string;
  gstNumber?: string;
  bankDetails?: {
    account: string;
    ifsc: string;
    name: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyType = 'girls-only' | 'co-ed-girls-floor' | 'hostel';
export type GuestPolicy = 'none' | 'day-only' | 'overnight-allowed';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type PGStatus = 'active' | 'inactive' | 'draft';

export type SafetyFeature = 
  | 'cctv' 
  | 'security-guard' 
  | 'biometric-entry' 
  | 'fire-extinguisher' 
  | 'fire-alarm' 
  | 'emergency-exit' 
  | 'female-warden' 
  | 'police-verified';

export interface RoomType {
  id: string;
  name: string;
  sharing: 1 | 2 | 3;
  count: number;
  rent: number;
  amenities: string[];
}

export interface PG {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  propertyType: PropertyType;
  totalRooms: number;
  availableRooms: number;
  roomTypes: RoomType[];
  amenities: string[];
  safetyFeatures: SafetyFeature[];
  pricing: {
    sharing: number;
    rent: number;
    deposit: number;
    foodIncluded: boolean;
    foodCost?: number;
  };
  photos: string[];
  videoTourUrl?: string;
  verification: {
    status: VerificationStatus;
    documents: string[];
    verifiedAt?: Date;
    verifiedBy?: string;
  };
  rules: {
    curfewTime?: string;
    guestPolicy: GuestPolicy;
    visitorHours?: string;
  };
  stats: {
    views: number;
    enquiries: number;
    bookings: number;
    avgRating: number;
    reviewCount: number;
  };
  status: PGStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type EnquiryStatus = 'new' | 'responded' | 'visit-scheduled' | 'booking-confirmed' | 'rejected' | 'cancelled';

export interface Enquiry {
  id: string;
  pgId: string;
  girlId: string;
  ownerId: string;
  message: string;
  status: EnquiryStatus;
  visitDate?: Date;
  bookingDetails?: {
    roomTypeId: string;
    moveInDate: Date;
    agreedRent: number;
    commission: number;
    commissionStatus: 'pending' | 'paid' | 'waived';
  };
  createdAt: Date;
  updatedAt: Date;
}

export type MessageType = 'text' | 'image' | 'document' | 'location' | 'system';

export interface Message {
  id: string;
  enquiryId: string;
  senderId: string;
  senderRole: 'girl' | 'owner';
  text: string;
  type: MessageType;
  read: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  pgId: string;
  girlId: string;
  girlName: string;
  rating: {
    overall: number;
    safety: number;
    cleanliness: number;
    food: number;
    ownerBehavior: number;
    valueForMoney: number;
  };
  text: string;
  photos?: string[];
  isAnonymous: boolean;
  verifiedStay: boolean;
  createdAt: Date;
}

export type SafetyAlertType = 'sos' | 'unsafe-area' | 'harassment' | 'other';
export type SafetyAlertStatus = 'active' | 'resolved';

export interface SafetyAlert {
  id: string;
  girlId: string;
  pgId?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  type: SafetyAlertType;
  message?: string;
  status: SafetyAlertStatus;
  responders: string[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface CommissionTransaction {
  id: string;
  enquiryId: string;
  pgId: string;
  ownerId: string;
  girlId: string;
  amount: number;
  platformFee: number;
  ownerPayout: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payoutId?: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface CommissionTier {
  minAmount: number;
  maxAmount: number | null;
  percentage: number;
  minFee: number;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { minAmount: 5000, maxAmount: 10000, percentage: 10, minFee: 500 },
  { minAmount: 10000, maxAmount: 20000, percentage: 8, minFee: 800 },
  { minAmount: 20000, maxAmount: null, percentage: 5, minFee: 1000 },
];

export function calculateCommission(rent: number): { platformFee: number; ownerPayout: number } {
  const tier = COMMISSION_TIERS.find(t => 
    rent >= t.minAmount && (t.maxAmount === null || rent < t.maxAmount)
  ) || COMMISSION_TIERS[0];
  
  const fee = Math.max(Math.round(rent * tier.percentage / 100), tier.minFee);
  return {
    platformFee: fee,
    ownerPayout: rent - fee,
  };
}