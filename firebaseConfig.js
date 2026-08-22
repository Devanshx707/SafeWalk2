import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBFnfMeQMjhIRwY893nkeG_W-kNjwkzkUs",
  authDomain: "safewalk-492.firebaseapp.com",
  projectId: "safewalk-492",
  storageBucket: "safewalk-492.firebasestorage.app",
  messagingSenderId: "896916123426",
  appId: "1:896916123426:web:6da5f7ba1b0776d2c2bf7b"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
