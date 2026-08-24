import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification,
  verifyPasswordResetCode,
  confirmPasswordReset,
  sendPasswordResetEmail,
  PhoneAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { getAuthInstance } from '../firebase';
import { User, UserRole } from '../../types';
import { createUser, getUser, updateUser, getUserByPhone } from '../firestore';

const auth = getAuthInstance();

// ReCAPTCHA verifier for phone auth (web only)
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function initializeRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  if (typeof window === 'undefined') return null;
  
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      recaptchaVerifier = null;
    },
  });
  
  return recaptchaVerifier;
}

export async function sendPhoneOTP(phoneNumber: string, containerId?: string): Promise<ConfirmationResult> {
  // Format phone number for India
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  let verifier: RecaptchaVerifier | null = null;
  
  if (typeof window !== 'undefined') {
    verifier = initializeRecaptcha(containerId);
  }
  
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier!);
    return confirmationResult;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

export async function verifyPhoneOTP(confirmationResult: ConfirmationResult, otp: string): Promise<FirebaseUser> {
  try {
    const result = await confirmationResult.confirm(otp);
    return result.user;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

export async function signInWithPhone(phoneNumber: string, otp: string, containerId?: string): Promise<FirebaseUser> {
  const confirmationResult = await sendPhoneOTP(phoneNumber, containerId);
  return verifyPhoneOTP(confirmationResult, otp);
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If already has country code
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  
  // If 10 digit Indian number
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // If 11 digit starting with 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  
  // Default: assume Indian number
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  return `+${digits}`;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentUser(): Promise<FirebaseUser | null> {
  return auth.currentUser;
}

export async function completeProfile(firebaseUser: FirebaseUser, profileData: {
  name: string;
  role: UserRole;
  email?: string;
  college?: string;
  workplace?: string;
  emergencyContact?: { name: string; phone: string };
  businessName?: string;
  gstNumber?: string;
}): Promise<void> {
  // Update Firebase Auth profile
  await updateProfile(firebaseUser, {
    displayName: profileData.name,
  });
  
  // Check if user already exists in Firestore
  const existingUser = await getUser(firebaseUser.uid);
  
  if (!existingUser) {
    // Create new user document
    const phoneNumber = firebaseUser.phoneNumber || '';
    await createUser({
      uid: firebaseUser.uid,
      role: profileData.role,
      phone: phoneNumber,
      name: profileData.name,
      email: profileData.email,
      college: profileData.college,
      workplace: profileData.workplace,
      emergencyContact: profileData.emergencyContact,
      businessName: profileData.businessName,
      gstNumber: profileData.gstNumber,
      verificationStatus: profileData.role === 'owner' ? 'pending' : 'verified',
    });
  } else {
    // Update existing user
    await updateUser(firebaseUser.uid, {
      name: profileData.name,
      email: profileData.email,
      role: profileData.role,
      college: profileData.college,
      workplace: profileData.workplace,
      emergencyContact: profileData.emergencyContact,
      businessName: profileData.businessName,
      gstNumber: profileData.gstNumber,
    });
  }
}

export async function getCurrentUserProfile(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  const user = await getUser(firebaseUser.uid);
  return user;
}

export async function updateUserProfile(data: Partial<User>): Promise<void> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Not authenticated');
  
  await updateUser(firebaseUser.uid, data);
  
  // Update display name if changed
  if (data.name) {
    await updateProfile(firebaseUser, { displayName: data.name });
  }
}

export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/invalid-phone-number': 'Invalid phone number format',
    'auth/missing-phone-number': 'Phone number is required',
    'auth/invalid-verification-code': 'Invalid OTP. Please try again.',
    'auth/code-expired': 'OTP has expired. Please request a new one.',
    'auth/too-many-requests': 'Too many requests. Please try again later.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/user-not-found': 'User not found',
    'auth/user-disabled': 'This account has been disabled',
    'auth/operation-not-allowed': 'Phone authentication is not enabled',
    'auth/permission-denied': 'Permission denied',
    'auth/internal-error': 'An internal error occurred',
  };
  
  return messages[code] || `Authentication error: ${code}`;
}

export async function linkPhoneNumber(firebaseUser: FirebaseUser, phoneNumber: string, otp: string): Promise<void> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const credential = PhoneAuthProvider.credential(formattedPhone, otp);
  await firebaseUser.linkWithCredential(credential);
}

export async function unlinkPhoneNumber(firebaseUser: FirebaseUser): Promise<void> {
  await firebaseUser.unlink(PhoneAuthProvider.PROVIDER_ID);
}

export async function sendEmailVerificationLink(): Promise<void> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser || !firebaseUser.email) throw new Error('No email associated');
  await sendEmailVerification(firebaseUser);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function confirmPasswordResetWithCode(code: string, newPassword: string): Promise<void> {
  await confirmPasswordReset(auth, code, newPassword);
}