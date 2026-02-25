import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'le votre',
  authDomain: 'le ',
  projectId: 'le votre',
  storageBucket: 'le votre',
  messagingSenderId: 'le votre',
  appId: 'le votre',
  measurementId: 'le votre',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);