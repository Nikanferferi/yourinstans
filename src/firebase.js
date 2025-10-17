import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import { firebaseConfig } from './firebase-config.js';

let app;
let auth;
let googleProvider;

function ensureInitialized() {
  if (!app) {
    if (!firebaseConfig || firebaseConfig.apiKey === 'YOUR_API_KEY') {
      console.warn(
        'Firebase-konfigurationen använder standardvärden. Uppdatera src/firebase-config.js med riktiga nycklar.'
      );
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  }

  return { app, auth, googleProvider };
}

export function initFirebase() {
  return ensureInitialized();
}

export function signInWithGoogle() {
  ensureInitialized();
  return signInWithPopup(auth, googleProvider);
}

export function watchAuthState(callback) {
  ensureInitialized();
  return onAuthStateChanged(auth, callback);
}

export function signOutUser() {
  ensureInitialized();
  return signOut(auth);
}

export async function signUpWithEmail(email, password) {
  ensureInitialized();
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  if (!user.displayName) {
    await updateProfile(user, { displayName: email.split('@')[0] });
  }

  return user;
}

export function signInWithEmail(email, password) {
  ensureInitialized();
  return signInWithEmailAndPassword(auth, email, password);
}
