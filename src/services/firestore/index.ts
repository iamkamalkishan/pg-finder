// Firestore facade — routes every call to the real Firebase backend or the
// in-memory demo backend depending on whether Firebase is configured.
//
// NOTE: explicit re-exports instead of `export *` because both implementations
// share function names — star-exports of ambiguous names are dropped silently.
import { isFirebaseConfigured } from '../firebase/config';

import * as realImpl from './real';
import * as demoImpl from './demoImpl';

const impl = isFirebaseConfigured ? realImpl : demoImpl;

// Users
export const createUser = impl.createUser;
export const getUser = impl.getUser;
export const updateUser = impl.updateUser;
export const getUserByPhone = impl.getUserByPhone;

// PGs
export const createPG = impl.createPG;
export const getPG = impl.getPG;
export const updatePG = impl.updatePG;
export const deletePG = impl.deletePG;
export const getPGsByOwner = impl.getPGsByOwner;
export const searchPGs = impl.searchPGs;
export const incrementPGStat = impl.incrementPGStat;

// Enquiries
export const createEnquiry = impl.createEnquiry;
export const getEnquiry = impl.getEnquiry;
export const updateEnquiry = impl.updateEnquiry;
export const getEnquiriesByGirl = impl.getEnquiriesByGirl;
export const getEnquiriesByOwner = impl.getEnquiriesByOwner;
export const getEnquiriesByPG = impl.getEnquiriesByPG;

// Messages
export const sendMessage = impl.sendMessage;
export const getMessages = impl.getMessages;
export const markMessagesAsRead = impl.markMessagesAsRead;

// Reviews
export const createReview = impl.createReview;
export const getReviewsByPG = impl.getReviewsByPG;
export const getReviewByGirlAndPG = impl.getReviewByGirlAndPG;

// Safety alerts
export const createSafetyAlert = impl.createSafetyAlert;
export const getSafetyAlertsByGirl = impl.getSafetyAlertsByGirl;
export const resolveSafetyAlert = impl.resolveSafetyAlert;

// Commissions
export const createCommissionTransaction = impl.createCommissionTransaction;
export const getCommissionTransactionsByOwner = impl.getCommissionTransactionsByOwner;
export const updateCommissionTransaction = impl.updateCommissionTransaction;

// Misc — available in either backend
export const getSafetyScoreForArea =
  (impl as any).getSafetyScoreForArea || realImpl.getSafetyScoreForArea;
export const uploadChatImage =
  (impl as any).uploadChatImage || (async () => {
    throw new Error('Chat image upload requires Firebase Storage');
  });

// Re-export types & interfaces consumers rely on
export type { PGSearchFilters } from './real';
