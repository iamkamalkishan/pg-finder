import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User, UserRole } from "../types";
import {
  getCurrentUserProfile,
  updateUserProfile,
  signOutUser,
  onAuthStateChange,
  isDemoMode,
  makeDemoFirebaseUser,
  setDemoSignedIn,
} from "../services/auth";
import { initializeFirebase } from "../services/firebase";
import { demoDb, makeDemoUid, delay } from "../services/demoData";

// Initialize Firebase
initializeFirebase();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (phone: string, otp: string) => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  completeProfile: (data: Partial<User> & { role: UserRole }) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  isGirl: boolean;
  isOwner: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

let confirmationResult: any = null;
let demoPendingPhone: string | null = null;

function makeDemoUidPrefix(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10) || "9999999999";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getCurrentUserProfile();
          setUser(profile);
        } catch (err) {
          console.error("Error loading user profile:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const sendOTP = useCallback(async (phone: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode()) {
        await delay(600); // simulate network
        demoPendingPhone = phone;
        confirmationResult = {
          confirm: async () => makeDemoFirebaseUser(makeDemoUidPrefix(phone)),
        } as any;
        console.log('📱 [DEMO MODE] OTP skip — koi bhi 6 digit daalo (e.g. 123456)');
        return;
      }
      // Import dynamically to avoid circular dependency
      const { sendPhoneOTP } = await import("../services/auth");
      confirmationResult = await sendPhoneOTP(phone);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (otp: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode()) {
        await delay(500);
        if (!otp || otp.length !== 6) {
          throw new Error("6-digit OTP daalo (demo me koi bhi chalega)");
        }
        const fbUser = makeDemoFirebaseUser(makeDemoUidPrefix(demoPendingPhone || "9999999999"));
        setDemoSignedIn(fbUser);
        // Pre-create an empty profile; Onboarding will complete it
        if (!demoDb.users.has(fbUser.uid)) {
          demoDb.users.set(fbUser.uid, {
            uid: fbUser.uid,
            role: "girl",
            phone: fbUser.phoneNumber,
            name: "",
            verificationStatus: "verified",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as User);
        }
        return;
      }
      const { verifyPhoneOTP } = await import("../services/auth");
      await verifyPhoneOTP(confirmationResult, otp);
      // User profile will be loaded via onAuthStateChange
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (phone: string, otp: string) => {
      await sendOTP(phone);
      await verifyOTP(otp);
    },
    [sendOTP, verifyOTP],
  );

  const completeProfile = useCallback(
    async (data: Partial<User> & { role: UserRole }) => {
      setError(null);
      setLoading(true);
      try {
        if (isDemoMode()) {
          await delay(400);
          const { getCurrentUser } = await import("../services/auth");
          const fbUser: any = await getCurrentUser();
          if (!fbUser) throw new Error("Not authenticated");
          const profile: User = {
            uid: fbUser.uid,
            role: data.role,
            phone: fbUser.phoneNumber || "",
            name: data.name || "",
            email: data.email,
            college: data.college,
            workplace: data.workplace,
            emergencyContact: data.emergencyContact,
            businessName: data.businessName,
            gstNumber: data.gstNumber,
            verificationStatus: data.role === "owner" ? "verified" : "verified",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          demoDb.users.set(fbUser.uid, profile);
          setUser(profile);
          return;
        }
        const { completeProfile: completeProfileAuth } =
          await import("../services/auth");
        await completeProfileAuth(
          { uid: "", displayName: "", phoneNumber: "" } as any, // firebaseUser will be fetched inside
          data,
        );
        const profile = await getCurrentUserProfile();
        setUser(profile);
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateProfile = useCallback(async (data: Partial<User>) => {
    setError(null);
    try {
      await updateUserProfile(data);
      const profile = await getCurrentUserProfile();
      setUser(profile);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    sendOTP,
    verifyOTP,
    completeProfile,
    updateProfile,
    signOut,
    clearError,
    isGirl: user?.role === "girl",
    isOwner: user?.role === "owner",
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
