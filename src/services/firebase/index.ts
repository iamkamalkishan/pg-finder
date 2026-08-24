import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { firebaseConfig, isFirebaseConfigured } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;
let messaging: Messaging | null = null;

export function initializeFirebase() {
  if (!isFirebaseConfigured) {
    console.warn('Firebase not configured - using mock mode');
    return;
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);

  // Initialize messaging only if supported (web only)
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        messaging = getMessaging(app);
      }
    });
  }

  // Connect to emulators in development
  if (__DEV__ && process.env.EXPO_PUBLIC_USE_EMULATORS === 'true') {
    const host = 'localhost';
    connectAuthEmulator(auth, `http://${host}:9099`);
    connectFirestoreEmulator(db, host, 8080);
    connectStorageEmulator(storage, host, 9199);
    connectFunctionsEmulator(functions, host, 5001);
    console.log('🔧 Connected to Firebase emulators');
  }

  return { app, auth, db, storage, functions, messaging };
}

export function getFirebaseApp() {
  if (!app) initializeFirebase();
  return app;
}

export function getAuthInstance() {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirestoreInstance() {
  if (!db) initializeFirebase();
  return db;
}

export function getStorageInstance() {
  if (!storage) initializeFirebase();
  return storage;
}

export function getFunctionsInstance() {
  if (!functions) initializeFirebase();
  return functions;
}

export function getMessagingInstance() {
  if (!messaging) initializeFirebase();
  return messaging;
}

export { auth, db, storage, functions, messaging };
export default { auth, db, storage, functions, messaging };