// In-memory demo backend for firestore operations (used when Firebase not configured).
import {
  PG,
  User,
  Enquiry,
  Message,
  Review,
  SafetyAlert,
  CommissionTransaction,
  PGStatus,
  EnquiryStatus,
} from '../types';
import { demoDb, nextDemoId } from '../demoData';
import { PGSearchFilters } from './real';
import type {} from '../../types';

// ---------- Users ----------
export async function createUser(userData: any): Promise<void> {
  demoDb.users.set(userData.uid, {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User);
}

export async function getUser(uid: string): Promise<User | null> {
  return demoDb.users.get(uid) || null;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  const existing = demoDb.users.get(uid);
  if (existing) {
    demoDb.users.set(uid, { ...existing, ...data, updatedAt: new Date() });
  }
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  for (const u of demoDb.users.values()) {
    if (u.phone === phone) return u;
  }
  return null;
}

// ---------- PGs ----------
export async function createPG(pgData: any): Promise<string> {
  const id = nextDemoId('pg');
  const pg: PG = {
    ...pgData,
    id,
    stats: { views: 0, enquiries: 0, bookings: 0, avgRating: 0, reviewCount: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
    photos: pgData.photos && pgData.photos.length > 0
      ? pgData.photos
      : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=60'],
  } as PG;
  demoDb.pgs.unshift(pg);
  return id;
}

export async function getPG(pgId: string): Promise<PG | null> {
  return demoDb.pgs.find((p) => p.id === pgId) || null;
}

export async function updatePG(pgId: string, data: Partial<PG>): Promise<void> {
  const idx = demoDb.pgs.findIndex((p) => p.id === pgId);
  if (idx >= 0) {
    demoDb.pgs[idx] = { ...demoDb.pgs[idx], ...data, updatedAt: new Date() };
  }
}

export async function deletePG(pgId: string): Promise<void> {
  const idx = demoDb.pgs.findIndex((p) => p.id === pgId);
  if (idx >= 0) demoDb.pgs.splice(idx, 1);
}

export async function getPGsByOwner(ownerId: string, status?: PGStatus): Promise<PG[]> {
  let list = demoDb.pgs.filter((p) => p.ownerId === ownerId);
  if (status) list = list.filter((p) => p.status === status);
  // Also include demo owner listings created under 'demo-owner'
  if (ownerId.startsWith('demo-owner')) {
    list = [...list, ...demoDb.pgs.filter((p) => p.ownerId === 'demo-owner')];
  }
  return list;
}

export async function searchPGs(
  filters: PGSearchFilters = {},
  pageSize: number = 20,
  _lastDoc?: any,
): Promise<{ pgs: PG[]; lastDoc: any }> {
  let list = [...demoDb.pgs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (filters.city) {
    const c = filters.city.toLowerCase();
    list = list.filter((p) => p.address.city.toLowerCase().includes(c));
  }
  if (filters.state) {
    const s = filters.state.toLowerCase();
    list = list.filter((p) => p.address.state.toLowerCase().includes(s));
  }
  if (filters.propertyType) {
    list = list.filter((p) => p.propertyType === filters.propertyType);
  }
  if (filters.minRent !== undefined) {
    list = list.filter((p) => p.pricing.rent >= filters.minRent!);
  }
  if (filters.maxRent !== undefined) {
    list = list.filter((p) => p.pricing.rent <= filters.maxRent!);
  }
  if (filters.sharing) {
    list = list.filter((p) =>
      p.roomTypes.some((r) => r.sharing === filters.sharing) || p.pricing.sharing === filters.sharing,
    );
  }
  if (filters.verifiedOnly) {
    list = list.filter((p) => p.verification.status === 'verified');
  }
  if (filters.amenities && filters.amenities.length > 0) {
    list = list.filter((pg) => filters.amenities!.every((a) => pg.amenities.includes(a)));
  }
  if (filters.safetyFeatures && filters.safetyFeatures.length > 0) {
    list = list.filter((pg) =>
      filters.safetyFeatures!.every((sf) => pg.safetyFeatures.includes(sf)),
    );
  }

  return { pgs: list.slice(0, pageSize), lastDoc: null };
}

export async function incrementPGStat(
  pgId: string,
  field: 'views' | 'enquiries' | 'bookings',
  increment: number = 1,
): Promise<void> {
  const pg = demoDb.pgs.find((p) => p.id === pgId);
  if (pg && pg.stats[field] !== undefined) {
    pg.stats[field] += increment;
  }
}

// ---------- Enquiries ----------
export async function createEnquiry(enquiryData: any): Promise<string> {
  const id = nextDemoId('enq');
  const enquiry: Enquiry = {
    ...enquiryData,
    id,
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Enquiry;
  demoDb.enquiries.unshift(enquiry);

  const pg = demoDb.pgs.find((p) => p.id === enquiryData.pgId);
  if (pg) pg.stats.enquiries += 1;

  // Auto owner reply after a moment (simulated)
  setTimeout(() => {
    demoDb.messages.push({
      id: nextDemoId('msg'),
      enquiryId: id,
      senderId: enquiryData.ownerId || 'demo-owner',
      senderRole: 'owner',
      text: 'Namaste! 🙏 Aapki enquiry mil gayi. Visit kab plan kar rahi hain? Aap chahein to kal aa sakti hain, main available rahunga.',
      type: 'text',
      read: false,
      createdAt: new Date(),
    });
  }, 2500);

  return id;
}

export async function getEnquiry(enquiryId: string): Promise<Enquiry | null> {
  return demoDb.enquiries.find((e) => e.id === enquiryId) || null;
}

export async function updateEnquiry(enquiryId: string, data: Partial<Enquiry>): Promise<void> {
  const idx = demoDb.enquiries.findIndex((e) => e.id === enquiryId);
  if (idx >= 0) {
    demoDb.enquiries[idx] = { ...demoDb.enquiries[idx], ...data, updatedAt: new Date() };
  }
}

export async function getEnquiriesByGirl(girlId: string, status?: EnquiryStatus): Promise<Enquiry[]> {
  let list = demoDb.enquiries.filter((e) => e.girlId === girlId);
  if (status) list = list.filter((e) => e.status === status);
  return list;
}

export async function getEnquiriesByOwner(ownerId: string, status?: EnquiryStatus): Promise<Enquiry[]> {
  let list = demoDb.enquiries.filter((e) => e.ownerId === ownerId);
  if (status) list = list.filter((e) => e.status === status);
  return list;
}

export async function getEnquiriesByPG(pgId: string, status?: EnquiryStatus): Promise<Enquiry[]> {
  let list = demoDb.enquiries.filter((e) => e.pgId === pgId);
  if (status) list = list.filter((e) => e.status === status);
  return list;
}

// ---------- Messages ----------
export async function sendMessage(messageData: any): Promise<string> {
  const id = nextDemoId('msg');
  demoDb.messages.push({
    ...messageData,
    id,
    createdAt: new Date(),
  } as Message);

  // Simulated typing delay + auto-reply from the other side (only for girl messages)
  if (messageData.senderRole === 'girl') {
    setTimeout(() => {
      const replies = [
        'Ji bilkul! 👍',
        'Theek hai, main check karke batati/batata hoon.',
        'Visit ke liye weekend best rahega. Kya timing suitable hai?',
        'Haan ji, room available hai. Deposit first month ke saath hai.',
      ];
      demoDb.messages.push({
        id: nextDemoId('msg'),
        enquiryId: messageData.enquiryId,
        senderId: 'demo-owner',
        senderRole: 'owner',
        text: replies[Math.floor(Math.random() * replies.length)],
        type: 'text',
        read: false,
        createdAt: new Date(),
      });
    }, 2000);
  }

  return id;
}

export async function getMessages(
  enquiryId: string,
  pageSize: number = 50,
  _lastDoc?: any,
): Promise<{ messages: Message[]; lastDoc: any }> {
  const messages = demoDb.messages
    .filter((m) => m.enquiryId === enquiryId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-pageSize);
  return { messages, lastDoc: null };
}

export async function markMessagesAsRead(enquiryId: string, userId: string): Promise<void> {
  for (const m of demoDb.messages) {
    if (m.enquiryId === enquiryId && m.senderId !== userId) m.read = true;
  }
}

// ---------- Reviews ----------
export async function createReview(reviewData: any): Promise<string> {
  const id = nextDemoId('review');
  demoDb.reviews.unshift({ ...reviewData, id, createdAt: new Date() } as Review);
  const pg = demoDb.pgs.find((p) => p.id === reviewData.pgId);
  if (pg) {
    pg.stats.reviewCount += 1;
    const total = pg.stats.avgRating * (pg.stats.reviewCount - 1) + reviewData.rating.overall;
    pg.stats.avgRating = Math.round((total / pg.stats.reviewCount) * 10) / 10;
  }
  return id;
}

export async function getReviewsByPG(pgId: string, pageSize: number = 20): Promise<Review[]> {
  return demoDb.reviews.filter((r) => r.pgId === pgId).slice(0, pageSize);
}

export async function getReviewByGirlAndPG(girlId: string, pgId: string): Promise<Review | null> {
  return demoDb.reviews.find((r) => r.girlId === girlId && r.pgId === pgId) || null;
}

// ---------- Safety Alerts ----------
export async function createSafetyAlert(alertData: any): Promise<string> {
  const id = nextDemoId('alert');
  demoDb.safetyAlerts.unshift({ ...alertData, id, createdAt: new Date(), status: 'active' } as SafetyAlert);
  return id;
}

export async function getSafetyAlertsByGirl(girlId: string): Promise<SafetyAlert[]> {
  return demoDb.safetyAlerts.filter((a) => a.girlId === girlId);
}

export async function resolveSafetyAlert(alertId: string, responderId: string): Promise<void> {
  const alert = demoDb.safetyAlerts.find((a) => a.id === alertId);
  if (alert) {
    (alert as any).status = 'resolved';
    (alert as any).resolvedAt = new Date();
    (alert as any).responders = [responderId];
  }
}

// ---------- Commissions ----------
export async function createCommissionTransaction(txnData: any): Promise<string> {
  const id = nextDemoId('txn');
  demoDb.commissionTxns.unshift({ ...txnData, id, createdAt: new Date() } as CommissionTransaction);
  return id;
}

export async function getCommissionTransactionsByOwner(ownerId: string): Promise<CommissionTransaction[]> {
  return demoDb.commissionTxns.filter((t) => t.ownerId === ownerId);
}

export async function updateCommissionTransaction(txnId: string, data: Partial<CommissionTransaction>): Promise<void> {
  const idx = demoDb.commissionTxns.findIndex((t) => t.id === txnId);
  if (idx >= 0) {
    demoDb.commissionTxns[idx] = { ...demoDb.commissionTxns[idx], ...data };
  }
}

// Demo image "upload" — reads the local blob into a data URL so preview works.
export async function uploadChatImage(_path: string, blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60');
    reader.readAsDataURL(blob);
  });
}
