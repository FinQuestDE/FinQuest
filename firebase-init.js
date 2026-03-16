// ═══════════════════════════════════════════════════════════
// FinQuest – Firebase Initialization
// ═══════════════════════════════════════════════════════════
// ⚠️  WICHTIG: Ersetze die firebaseConfig unten mit deinen
//    eigenen Firebase-Projektdaten aus der Firebase Console:
//    https://console.firebase.google.com → Projekteinstellungen
// ═══════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Deine Firebase-Konfiguration ───────────────────────────
// Diese Werte findest du in der Firebase Console unter:
// Projekteinstellungen → Deine Apps → Web-App → firebaseConfig
const firebaseConfig = {
  apiKey:            "AIzaSyCjV-HKFMwM8RMCBnPNy9e2LMvHdPG9Z6M",
  authDomain:        "finquest-da0d5.firebaseapp.com",
  projectId:         "finquest-da0d5",
  storageBucket:     "finquest-da0d5.firebasestorage.app",
  messagingSenderId: "610861088960",
  appId:             "1:610861088960:web:83d060f02709e01fe62d25"
};

// ── Firebase initialisieren ────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Globale Exports für auth.js ────────────────────────────
// auth.js greift über window.FirebaseAuth und window.FirebaseDB zu
window.FirebaseAuth = {
  auth,
  createUserWithEmailAndPassword: (authInstance, email, pw) =>
    createUserWithEmailAndPassword(authInstance, email, pw),
  signInWithEmailAndPassword: (authInstance, email, pw) =>
    signInWithEmailAndPassword(authInstance, email, pw),
  signOut: (authInstance) => signOut(authInstance),
  onAuthStateChanged: (authInstance, cb) => onAuthStateChanged(authInstance, cb),
  sendEmailVerification: (user) => sendEmailVerification(user),
  sendPasswordResetEmail: (authInstance, email) => sendPasswordResetEmail(authInstance, email),
};

window.FirebaseDB = {
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
};

// ── Rangliste: Top-Nutzer aus Firestore laden ──────────────
window.fetchTopUsersFromFirestore = async function(limitCount = 10) {
  try {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      // Title aus Cosmetics für Leaderboard-Anzeige extrahieren
      const titleId = data.cosmetics?.title || null;
      return { id: d.id, ...data, _titleId: titleId };
    });
  } catch(e) {
    console.warn("Firestore Rangliste Fehler:", e);
    return [];
  }
};

// ── Einzelnen User-Snapshot aus Firestore laden ───────────
window.fetchUserFromFirestore = async function(userId) {
  if (!userId) return null;
  try {
    const docRef = doc(db, "users", userId);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch(e) {
    console.warn("Firestore User-Fetch Fehler:", e);
    return null;
  }
};

// ── Signal: Firebase ist bereit ────────────────────────────
window.dispatchEvent(new Event('firebaseLoaded'));

console.log("✅ Firebase erfolgreich initialisiert");
