import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBVYEh7SEyB3b5nkmKDTutmR71laXDL_Oo',
  authDomain: 'recoltecheck-df50d.firebaseapp.com',
  projectId: 'recoltecheck-df50d',
  storageBucket: 'recoltecheck-df50d.firebasestorage.app',
  messagingSenderId: '858690758351',
  appId: '1:858690758351:web:8be8a10279cb4d7bb379ba',
  measurementId: 'G-HMW3LJ7HWY',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);