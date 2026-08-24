export const APP_NAME = 'PG Finder for Girls';
export const APP_TAGLINE = 'Safe. Verified. Yours.';

export type PropertyType = 'girls-only' | 'co-ed-girls-floor' | 'hostel';
export type GuestPolicy = 'none' | 'day-only' | 'overnight-allowed';
export type SafetyFeature = 
  | 'cctv' 
  | 'security-guard' 
  | 'biometric-entry' 
  | 'fire-extinguisher' 
  | 'fire-alarm' 
  | 'emergency-exit' 
  | 'female-warden' 
  | 'police-verified';

export const COLORS = {
  primary: '#E91E63', // Pink - girls-focused
  primaryDark: '#C2185B',
  primaryLight: '#F8BBD0',
  secondary: '#4CAF50', // Green - safety
  secondaryDark: '#388E3C',
  secondaryLight: '#C8E6C9',
  accent: '#FF9800', // Orange - warnings/alerts
  background: '#FAFAFA',
  surface: '#FFFFFF',
  error: '#D32F2F',
  warning: '#F57C00',
  success: '#388E3C',
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  border: '#E0E0E0',
  divider: '#EEEEEE',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const AMENITIES = [
  'wifi',
  'ac',
  'food',
  'laundry',
  'housekeeping',
  'parking',
  'gym',
  'study-room',
  'common-room',
  'roof-access',
  'refrigerator',
  'geyser',
  'water-purifier',
  'power-backup',
] as const;

export const SAFETY_FEATURES = [
  'cctv',
  'security-guard',
  'biometric-entry',
  'fire-extinguisher',
  'fire-alarm',
  'emergency-exit',
  'female-warden',
  'police-verified',
] as const;

export const PROPERTY_TYPES = [
  { value: 'girls-only', label: 'Girls Only PG' },
  { value: 'co-ed-girls-floor', label: 'Co-ed (Girls Floor)' },
  { value: 'hostel', label: 'Girls Hostel' },
] as const;

export const GUEST_POLICIES = [
  { value: 'none', label: 'No Guests Allowed' },
  { value: 'day-only', label: 'Day Guests Only' },
  { value: 'overnight-allowed', label: 'Overnight Allowed' },
] as const;

export const SHARING_OPTIONS = [1, 2, 3] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

export const MAJOR_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar',
  'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai',
  'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior',
  'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati',
  'Chandigarh', 'Solapur', 'Hubli-Dharwad', 'Mysore', 'Tiruchirappalli',
  'Bareilly', 'Aligarh', 'Tiruppur', 'Gurgaon', 'Moradabad', 'Jalandhar',
  'Bhubaneswar', 'Salem', 'Warangal', 'Mira-Bhayandar', 'Thiruvananthapuram',
  'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Guntur', 'Bikaner', 'Amravati',
  'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi',
  'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela',
  'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar',
  'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu',
  'Mangalore', 'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon',
  'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala', 'Davanagere', 'Kozhikode',
  'Kurnool', 'Rajpur Sonarpur', 'Rajahmundry', 'Bokaro', 'South Dumdum',
  'Bellary', 'Patiala', 'Gopalpur', 'Agartala', 'Bhagalpur', 'Muzaffarnagar',
] as const;

export const SAFETY_SCORE_FACTORS = {
  cctv: 15,
  'security-guard': 20,
  'biometric-entry': 15,
  'fire-extinguisher': 10,
  'fire-alarm': 10,
  'emergency-exit': 10,
  'female-warden': 15,
  'police-verified': 20,
  verifiedOwner: 15,
  goodReviews: 10,
  safeNeighborhood: 10,
};

export const STORAGE_PATHS = {
  USER_AVATARS: 'users/avatars',
  PG_PHOTOS: 'pgs/photos',
  PG_DOCUMENTS: 'pgs/documents',
  OWNER_DOCUMENTS: 'owners/documents',
  CHAT_IMAGES: 'chat/images',
  CHAT_DOCUMENTS: 'chat/documents',
  REVIEW_PHOTOS: 'reviews/photos',
} as const;

export const COLLECTIONS = {
  USERS: 'users',
  PGs: 'pgs',
  ENQUIRIES: 'enquiries',
  MESSAGES: 'messages',
  REVIEWS: 'reviews',
  SAFETY_ALERTS: 'safetyAlerts',
  COMMISSION_TRANSACTIONS: 'commissionTransactions',
} as const;

export const ENQUIRY_STATUS_LABELS: Record<string, string> = {
  new: 'New Enquiry',
  responded: 'Owner Responded',
  'visit-scheduled': 'Visit Scheduled',
  'booking-confirmed': 'Booking Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Verification',
  verified: 'Verified ✓',
  rejected: 'Rejected',
};

export const PG_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
};

export const SAFETY_FEATURE_LABELS: Record<SafetyFeature, string> = {
  cctv: 'CCTV Cameras',
  'security-guard': 'Security Guard',
  'biometric-entry': 'Biometric Entry',
  'fire-extinguisher': 'Fire Extinguisher',
  'fire-alarm': 'Fire Alarm',
  'emergency-exit': 'Emergency Exit',
  'female-warden': 'Female Warden',
  'police-verified': 'Police Verified',
};

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  ac: 'Air Conditioning',
  food: 'Food/Mess',
  laundry: 'Laundry',
  housekeeping: 'Housekeeping',
  parking: 'Parking',
  gym: 'Gym',
  'study-room': 'Study Room',
  'common-room': 'Common Room',
  'roof-access': 'Roof Access',
  refrigerator: 'Refrigerator',
  geyser: 'Geyser',
  'water-purifier': 'Water Purifier',
  'power-backup': 'Power Backup',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  'girls-only': 'Girls Only PG',
  'co-ed-girls-floor': 'Co-ed (Girls Floor)',
  hostel: 'Girls Hostel',
};

export const GUEST_POLICY_LABELS: Record<GuestPolicy, string> = {
  none: 'No Guests',
  'day-only': 'Day Guests Only',
  'overnight-allowed': 'Overnight Allowed',
};

export const RATING_CATEGORIES = [
  { key: 'safety', label: 'Safety', icon: 'shield' },
  { key: 'cleanliness', label: 'Cleanliness', icon: 'sparkles' },
  { key: 'food', label: 'Food', icon: 'utensils' },
  { key: 'ownerBehavior', label: 'Owner Behavior', icon: 'user-check' },
  { key: 'valueForMoney', label: 'Value for Money', icon: 'currency-rupee' },
] as const;

export const PAGINATION_LIMIT = 20;
export const SEARCH_RADIUS_KM = 10;
export const MAX_PHOTOS_PER_PG = 20;
export const MAX_PHOTOS_PER_REVIEW = 5;
export const OTP_LENGTH = 6;
export const OTP_TIMEOUT_SECONDS = 60;