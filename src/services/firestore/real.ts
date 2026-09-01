import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  limitToLast,
  DocumentSnapshot,
  QueryConstraint,
  writeBatch,
  serverTimestamp,
  Timestamp,
  GeoPoint,
  runTransaction,
} from 'firebase/firestore';
import { getFirestoreInstance } from '../firebase';
import { 
  PG, 
  User, 
  Enquiry, 
  Message, 
  Review, 
  SafetyAlert,
  CommissionTransaction,
  PropertyType,
  SafetyFeature,
  EnquiryStatus,
  PGStatus,
} from '../../types';

const db = getFirestoreInstance();

// Collection references
const USERS_COL = 'users';
const PGS_COL = 'pgs';
const ENQUIRIES_COL = 'enquiries';
const MESSAGES_COL = 'messages';
const REVIEWS_COL = 'reviews';
const SAFETY_ALERTS_COL = 'safetyAlerts';
const COMMISSION_TXNS_COL = 'commissionTransactions';

// Helper to convert Firestore Timestamps to Date
function convertTimestamps(obj: any): any {
  if (!obj) return obj;
  if (obj instanceof Timestamp) return obj.toDate();
  if (obj instanceof GeoPoint) return { latitude: obj.latitude, longitude: obj.longitude };
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertTimestamps(obj[key]);
    }
    return result;
  }
  return obj;
}

// ========== USER OPERATIONS ==========

export async function createUser(userData: Omit<User, 'uid' | 'createdAt' | 'updatedAt'> & { uid: string }): Promise<void> {
  const now = serverTimestamp();
  await setDoc(doc(db, USERS_COL, userData.uid), {
    ...userData,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, USERS_COL, uid));
  if (!snap.exists()) return null;
  return convertTimestamps({ uid: snap.id, ...snap.data() }) as User;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, USERS_COL, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const q = query(collection(db, USERS_COL), where('phone', '==', phone), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return convertTimestamps({ uid: docSnap.id, ...docSnap.data() }) as User;
}

// ========== PG OPERATIONS ==========

export async function createPG(pgData: Omit<PG, 'id' | 'createdAt' | 'updatedAt' | 'stats'> & { ownerId: string }): Promise<string> {
  const pgRef = doc(collection(db, PGS_COL));
  const now = serverTimestamp();
  
  const pg: Omit<PG, 'id'> = {
    ...pgData,
    stats: {
      views: 0,
      enquiries: 0,
      bookings: 0,
      avgRating: 0,
      reviewCount: 0,
    },
    createdAt: now as any,
    updatedAt: now as any,
  };
  
  await setDoc(pgRef, pg);
  return pgRef.id;
}

export async function getPG(pgId: string): Promise<PG | null> {
  const snap = await getDoc(doc(db, PGS_COL, pgId));
  if (!snap.exists()) return null;
  return convertTimestamps({ id: snap.id, ...snap.data() }) as PG;
}

export async function updatePG(pgId: string, data: Partial<PG>): Promise<void> {
  await updateDoc(doc(db, PGS_COL, pgId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePG(pgId: string): Promise<void> {
  await deleteDoc(doc(db, PGS_COL, pgId));
}

export async function getPGsByOwner(ownerId: string, status?: PGStatus): Promise<PG[]> {
  let q = query(
    collection(db, PGS_COL),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );
  
  if (status) {
    q = query(q, where('status', '==', status));
  }
  
  const snap = await getDocs(q);
  return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as PG);
}

export interface PGSearchFilters {
  city?: string;
  state?: string;
  propertyType?: PropertyType;
  minRent?: number;
  maxRent?: number;
  sharing?: 1 | 2 | 3;
  amenities?: string[];
  safetyFeatures?: SafetyFeature[];
  verifiedOnly?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export async function searchPGs(
  filters: PGSearchFilters = {},
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ pgs: PG[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, PGS_COL),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  
  // Apply filters
  if (filters.verifiedOnly) {
    q = query(q, where('verification.status', '==', 'verified'));
  }
  
  if (filters.city) {
    q = query(q, where('address.city', '==', filters.city));
  }
  
  if (filters.state) {
    q = query(q, where('address.state', '==', filters.state));
  }
  
  if (filters.propertyType) {
    q = query(q, where('propertyType', '==', filters.propertyType));
  }
  
  if (filters.minRent !== undefined) {
    q = query(q, where('pricing.rent', '>=', filters.minRent));
  }
  
  if (filters.maxRent !== undefined) {
    q = query(q, where('pricing.rent', '<=', filters.maxRent));
  }
  
  if (filters.sharing) {
    q = query(q, where('pricing.sharing', '==', filters.sharing));
  }
  
  // Note: For amenities/safetyFeatures array-contains, we need multiple queries or client-side filtering
  // For geo queries, we'd need GeoFire or similar - skipping for now, client-side filter
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snap = await getDocs(q);
  const pgs = snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as PG);
  
  // Client-side filter for amenities, safety features, and geo
  let filtered = pgs;
  
  if (filters.amenities && filters.amenities.length > 0) {
    filtered = filtered.filter(pg => 
      filters.amenities!.every(a => pg.amenities.includes(a))
    );
  }
  
  if (filters.safetyFeatures && filters.safetyFeatures.length > 0) {
    filtered = filtered.filter(pg => 
      filters.safetyFeatures!.every(s => pg.safetyFeatures.includes(s))
    );
  }
  
  if (filters.latitude && filters.longitude && filters.radiusKm) {
    filtered = filtered.filter(pg => {
      const pgLat = pg.address.coordinates.latitude;
      const pgLon = pg.address.coordinates.longitude;
      const distance = calculateDistance(filters.latitude!, filters.longitude!, pgLat, pgLon);
      return distance <= filters.radiusKm!;
    });
  }
  
  return {
    pgs: filtered,
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function incrementPGStat(pgId: string, field: 'views' | 'enquiries' | 'bookings', increment: number = 1): Promise<void> {
  const pgRef = doc(db, PGS_COL, pgId);
  await updateDoc(pgRef, {
    [`stats.${field}`]: increment,
  });
}

// ========== ENQUIRY OPERATIONS ==========

export async function createEnquiry(enquiryData: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const enquiryRef = doc(collection(db, ENQUIRIES_COL));
  const now = serverTimestamp();
  
  await setDoc(enquiryRef, {
    ...enquiryData,
    createdAt: now,
    updatedAt: now,
  });
  
  // Increment PG enquiry count
  await incrementPGStat(enquiryData.pgId, 'enquiries');
  
  return enquiryRef.id;
}

export async function getEnquiry(enquiryId: string): Promise<Enquiry | null> {
  const snap = await getDoc(doc(db, ENQUIRIES_COL, enquiryId));
  if (!snap.exists()) return null;
  return convertTimestamps({ id: snap.id, ...snap.data() }) as Enquiry;
}

export async function updateEnquiry(enquiryId: string, data: Partial<Enquiry>): Promise<void> {
  await updateDoc(doc(db, ENQUIRIES_COL, enquiryId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getEnquiriesByGirl(girlId: string, status?: EnquiryStatus): Promise<Enquiry[]> {
  let q = query(
    collection(db, ENQUIRIES_COL),
    where('girlId', '==', girlId),
    orderBy('createdAt', 'desc')
  );
  
  if (status) {
    q = query(q, where('status', '==', status));
  }
  
  const snap = await getDocs(q);
  return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Enquiry);
}

export async function getEnquiriesByOwner(ownerId: string, status?: EnquiryStatus): Promise<Enquiry[]> {
  let q = query(
    collection(db, ENQUIRIES_COL),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );
  
  if (status) {
    q = query(q, where('status', '==', status));
  }
  
  const snap = await getDocs(q);
  return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Enquiry);
}

export async function getEnquiriesByPG(pgId: string, status?: EnquiryStatus): Promise<Enquiry[]> {
  let q = query(
    collection(db, ENQUIRIES_COL),
    where('pgId', '==', pgId),
    orderBy('createdAt', 'desc')
  );
  
  if (status) {
    q = query(q, where('status', '==', status));
  }
  
  const snap = await getDocs(q);
  return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Enquiry);
}

// ========== MESSAGE OPERATIONS ==========

export async function sendMessage(messageData: Omit<Message, 'id' | 'createdAt'>): Promise<string> {
  const messageRef = doc(collection(db, ENQUIRIES_COL, messageData.enquiryId, MESSAGES_COL));
  const now = serverTimestamp();
  
  await setDoc(messageRef, {
    ...messageData,
    createdAt: now,
  });
  
  // Update enquiry updatedAt
  await updateDoc(doc(db, ENQUIRIES_COL, messageData.enquiryId), {
    updatedAt: now,
  });
  
  return messageRef.id;
}

export async function getMessages(enquiryId: string, pageSize: number = 50, lastDoc?: DocumentSnapshot): Promise<{ messages: Message[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, ENQUIRIES_COL, enquiryId, MESSAGES_COL),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snap = await getDocs(q);
  const messages = snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Message);
  
  return {
    messages: messages.reverse(), // Oldest first for display
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
}

export async function markMessagesAsRead(enquiryId: string, userId: string): Promise<void> {
  const q = query(
    collection(db, ENQUIRIES_COL, enquiryId, MESSAGES_COL),
    where('senderId', '!=', userId),
    where('read', '==', false)
  );
  
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  
  snap.docs.forEach(docSnap => {
    batch.update(docSnap.ref, { read: true });
  });
  
  await batch.commit();
}

// ========== REVIEW OPERATIONS ==========

export async function createReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const reviewRef = doc(collection(db, REVIEWS_COL));
  const now = serverTimestamp();
  
  await setDoc(reviewRef, {
    ...reviewData,
    createdAt: now,
  });
  
  // Update PG stats (avg rating, review count) - would need a transaction for accuracy
  // For now, just increment count
  await incrementPGStat(reviewData.pgId, 'reviewCount' as any);
  
  return reviewRef.id;
}

export async function getReviewsByPG(pgId: string, pageSize: number = 20): Promise<Review[]> {
  const q = query(
    collection(db, REVIEWS_COL),
    where('pgId', '==', pgId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Review);
}

export async function getReviewByGirlAndPG(girlId: string, pgId: string): Promise<Review | null> {
  const q = query(
    collection(db, REVIEWS_COL),
    where('girlId', '==', girlId),
    where('pgId', '==', pgId),
    limit(1)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return null;
  
  const docSnap = snap.docs[0];
  return convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as Review;
}

// ========== SAFETY ALERT OPERATIONS ==========

export async function createSafetyAlert(alertData: Omit<SafetyAlert, 'id' | 'createdAt' | 'resolvedAt'>): Promise<string> {
  const alertRef = doc(collection(db, SAFETY_ALERTS_COL));
  const now = serverTimestamp();
  
  await setDoc(alertRef, {
    ...alertData,
    createdAt: now,
  });
  
  return alertRef.id;
}

export async function getSafetyAlertsByGirl(girlId: string): Promise<SafetyAlert[]> {
  const q = query(
    collection(db, SAFETY_ALERTS_COL),
    where('girlId', '==', girlId),
    orderBy('createdAt', 'desc')
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as SafetyAlert);
}

export async function resolveSafetyAlert(alertId: string, responderId: string): Promise<void> {
  const alertRef = doc(db, SAFETY_ALERTS_COL, alertId);
  await updateDoc(alertRef, {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    responders: (await getDoc(alertRef)).data()?.responders?.concat(responderId) || [responderId],
  });
}

// ========== COMMISSION OPERATIONS ==========

export async function createCommissionTransaction(txnData: Omit<CommissionTransaction, 'id' | 'createdAt' | 'paidAt'>): Promise<string> {
  const txnRef = doc(collection(db, COMMISSION_TXNS_COL));
  const now = serverTimestamp();
  
  await setDoc(txnRef, {
    ...txnData,
    createdAt: now,
  });
  
  return txnRef.id;
}

export async function getCommissionTransactionsByOwner(ownerId: string): Promise<CommissionTransaction[]> {
  const q = query(
    collection(db, COMMISSION_TXNS_COL),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as CommissionTransaction);
}

export async function updateCommissionTransaction(txnId: string, data: Partial<CommissionTransaction>): Promise<void> {
  await updateDoc(doc(db, COMMISSION_TXNS_COL, txnId), data);
}

// Safety score for area (calls cloud function)
export async function getSafetyScoreForArea(latitude: number, longitude: number, radiusKm: number = 1): Promise<{ score: number; breakdown: any }> {
  // In production, this would call a cloud function
  // For now, return a simulated score
  const baseScore = 50 + Math.random() * 30;
  const coordHash = Math.abs(Math.sin(latitude * 1000) * Math.cos(longitude * 1000)) * 20;
  const score = Math.min(100, Math.round(baseScore + coordHash));
  
  return {
    score,
    breakdown: {
      crimeRate: Math.round(80 - Math.random() * 40),
      lighting: Math.round(60 + Math.random() * 40),
      policePresence: Math.round(50 + Math.random() * 50),
      communityReports: Math.round(70 - Math.random() * 50),
    },
    lastUpdated: new Date().toISOString(),
  };
}