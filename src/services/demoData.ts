// Demo data & mock in-memory backend — used when Firebase is not configured.
// Lets the app run fully (browse, login, enquire, chat UI) without any keys.
import { PG, User, Enquiry, Message, Review, SafetyAlert, CommissionTransaction } from '../types';

export function makeDemoUid(phone: string): string {
  return `demo-${phone.replace(/\D/g, '')}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

const IMG_IDS = [
  '1522708323590-d24dbb6b0267',
  '1502672260266-1c1ef2d93688',
  '1554995207-c18c203602cb',
  '1493809842364-78817add7ffb',
  '1560448204-e02f11c3d0e2',
  '1484154218962-a197022b5858',
];

const img = (i: number) =>
  `https://images.unsplash.com/photo-${IMG_IDS[i % IMG_IDS.length]}?w=800&q=60`;

function makePG(
  n: number,
  title: string,
  city: string,
  state: string,
  area: string,
  pincode: string,
  lat: number,
  lng: number,
  rent: number,
  deposit: number,
  rating: number,
  reviews: number,
): PG {
  return {
    id: `demo-pg-${n}`,
    ownerId: 'demo-owner',
    title,
    description: `${title} - Girls ke liye safe aur comfortable accommodation. ${area}, ${city}. Ghar jaisa mahaul, homemade khana, aur poori security ke saath. Verified property with warden aur CCTV surveillance.`,
    address: {
      line1: `${10 + n}, ${area} Main Road`,
      line2: `Near ${area} Metro Station`,
      city,
      state,
      pincode,
      coordinates: { latitude: lat, longitude: lng },
    },
    propertyType: 'girls-only',
    totalRooms: 12 + n * 2,
    availableRooms: 2 + (n % 4),
    roomTypes: [
      { id: `r${n}-1`, name: 'Single Room', sharing: 1, count: 3, rent: Math.round(rent * 1.6), amenities: ['AC', 'Attached Bathroom'] },
      { id: `r${n}-2`, name: 'Double Sharing', sharing: 2, count: 6, rent, amenities: ['AC', 'Study Table'] },
      { id: `r${n}-3`, name: 'Triple Sharing', sharing: 3, count: 5, rent: Math.round(rent * 0.75), amenities: ['Fan', 'Balcony'] },
    ],
    amenities: ['WiFi', 'AC', 'Laundry', 'Power Backup', 'RO Water', 'Housekeeping', 'Geyser'],
    safetyFeatures: ['cctv', 'security-guard', 'female-warden', 'fire-extinguisher', 'biometric-entry', 'emergency-exit'],
    pricing: {
      sharing: 2,
      rent,
      deposit,
      foodIncluded: true,
      foodCost: 0,
    },
    photos: [img(n), img(n + 1), img(n + 2)],
    verification: {
      status: n % 4 === 3 ? 'pending' : 'verified',
      documents: ['owner-id.pdf', 'property-proof.pdf'],
    },
    rules: {
      curfewTime: '22:00',
      guestPolicy: n % 2 === 0 ? 'day-only' : 'none',
      visitorHours: '10:00 - 18:00 (Common Area)',
    },
    stats: {
      views: 40 + n * 37,
      enquiries: 3 + n,
      bookings: n % 5,
      avgRating: rating,
      reviewCount: reviews,
    },
    status: 'active',
    createdAt: new Date(Date.now() - n * 86400000),
    updatedAt: new Date(Date.now() - n * 3600000),
  };
}

export const DEMO_PGS: PG[] = [
  makePG(1, 'Shree Ganesh Girls PG', 'Pune', 'Maharashtra', 'Kothrud', '411038', 18.5074, 73.8077, 8500, 17000, 4.5, 28),
  makePG(2, 'Lakshmi Hostel for Women', 'Hyderabad', 'Telangana', 'Ameerpet', '500016', 17.4374, 78.4487, 6500, 10000, 4.2, 41),
  makePG(3, 'Sunrise Girls PG', 'Bengaluru', 'Karnataka', 'Koramangala', '560034', 12.9352, 77.6245, 12000, 24000, 4.8, 56),
  makePG(4, 'Maa Vaishno Devi PG', 'New Delhi', 'Delhi', 'Mukherjee Nagar', '110009', 28.7095, 77.2100, 7500, 12500, 4.0, 33),
  makePG(5, 'Sri Sai Balaji Girls Hostel', 'Chennai', 'Tamil Nadu', 'T. Nagar', '600017', 13.0418, 80.2341, 9000, 18000, 4.4, 22),
  makePG(6, 'Ananya Home PG', 'Indore', 'Madhya Pradesh', 'Bhawarkuan', '452001', 22.7196, 75.8577, 5500, 8000, 4.6, 19),
];

export const DEMO_OWNER: User = {
  uid: 'demo-owner',
  role: 'owner',
  phone: '+919999000001',
  name: 'Ramesh Kumar (Owner)',
  businessName: 'Shree Properties',
  verificationStatus: 'verified',
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface DemoEnquiry extends Enquiry {}
interface DemoMessage extends Message {}

export interface DemoDb {
  users: Map<string, User>;
  pgs: PG[];
  enquiries: Enquiry[];
  messages: Message[];
  reviews: Review[];
  safetyAlerts: SafetyAlert[];
  commissionTxns: CommissionTransaction[];
  seq: number;
}

export const demoDb: DemoDb = {
  users: new Map(),
  pgs: DEMO_PGS,
  enquiries: [],
  messages: [],
  reviews: [
    {
      id: 'demo-review-1',
      pgId: 'demo-pg-1',
      girlId: 'demo-girl-r1',
      girlName: 'Priya S.',
      rating: { overall: 5, safety: 5, cleanliness: 4, food: 5, ownerBehavior: 5 },
      comment: 'Bahut safe hai yahan. Warden didi bahut caring hain aur food ghar jaisa milta hai.',
      isAnonymous: false,
      createdAt: new Date(Date.now() - 5 * 86400000),
    },
    {
      id: 'demo-review-2',
      pgId: 'demo-pg-3',
      girlId: 'demo-girl-r2',
      girlName: 'Anonymous',
      rating: { overall: 4, safety: 5, cleanliness: 4, food: 3, ownerBehavior: 4 },
      comment: 'Location best hai, everything walking distance. Food thoda improve ho sakta hai.',
      isAnonymous: true,
      createdAt: new Date(Date.now() - 2 * 86400000),
    },
  ] as Review[],
  safetyAlerts: [],
  commissionTxns: [
    {
      id: 'demo-txn-1',
      enquiryId: 'demo-enq-seed-1',
      pgId: 'demo-pg-1',
      ownerId: 'demo-owner',
      girlId: 'demo-girl-x1',
      amount: 17000,
      commissionRate: 0.5,
      commissionAmount: 8500,
      status: 'paid',
      createdAt: new Date(Date.now() - 15 * 86400000),
      paidAt: new Date(Date.now() - 14 * 86400000),
    },
    {
      id: 'demo-txn-2',
      enquiryId: 'demo-enq-seed-2',
      pgId: 'demo-pg-3',
      ownerId: 'demo-owner',
      girlId: 'demo-girl-x2',
      amount: 24000,
      commissionRate: 0.5,
      commissionAmount: 12000,
      status: 'pending',
      createdAt: new Date(Date.now() - 3 * 86400000),
    },
  ] as CommissionTransaction[],
  seq: 100,
};

export function nextDemoId(prefix: string): string {
  demoDb.seq += 1;
  return `${prefix}-${demoDb.seq}`;
}
