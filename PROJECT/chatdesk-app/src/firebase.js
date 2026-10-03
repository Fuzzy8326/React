// Firebase configuration
// IMPORTANT: Replace with your own Firebase project credentials from the Firebase Console
// Go to Project Settings > General > Your apps > Firebase SDK snippet > Config

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA4AToOf2RV6nwfSi26Z4GBb2L1OSYaHyc",
  authDomain: "chatdesk-d2395.firebaseapp.com",
  projectId: "chatdesk-d2395",
  storageBucket: "chatdesk-d2395.firebasestorage.app",
  messagingSenderId: "455483277928",
  appId: "1:455483277928:web:8b4494fa0361ab73a531dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
