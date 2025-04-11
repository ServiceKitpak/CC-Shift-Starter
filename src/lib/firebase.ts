import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBt7yOqvaiyNRS5KE54szNhT0pCGnIliv8",
    authDomain: "cc-hrmanagement.firebaseapp.com",
    databaseURL: "https://cc-hrmanagement-default-rtdb.firebaseio.com",
    projectId: "cc-hrmanagement",
    storageBucket: "cc-hrmanagement.firebasestorage.app",
    messagingSenderId: "347949507749",
    appId: "1:347949507749:web:414d6d0580964be4d2d94c",
    measurementId: "G-0WGQWCTEWW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };