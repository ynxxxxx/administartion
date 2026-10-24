'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyASbK0rUEPybnQJSoNf_woEMDOxE7n8o9g",
  authDomain: "ullista.firebaseapp.com",
  projectId: "ullista",
  storageBucket: "ullista.firebasestorage.app",
  messagingSenderId: "454913615375",
  appId: "1:454913615375:web:f8fb2fb157887809a5657a",
  measurementId: "G-L8DE2FXXB2"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
