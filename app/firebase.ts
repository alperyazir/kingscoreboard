import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAr6qTYf81SkIhGwJPFeh-akj2wESnmVf0",
  authDomain: "kingscoreboard-46007.firebaseapp.com",
  projectId: "kingscoreboard-46007",
  storageBucket: "kingscoreboard-46007.firebasestorage.app",
  messagingSenderId: "770704393336",
  appId: "1:770704393336:web:7031d5efc3b5d26597598d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 