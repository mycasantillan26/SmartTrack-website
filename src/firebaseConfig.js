import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6njbmZq5CBlOxVnb28GEvtXwT_yKyaUA",
    authDomain: "smarttrack-e2cac.firebaseapp.com",
    projectId: "smarttrack-e2cac",
    storageBucket: "smarttrack-e2cac.appspot.com",
    messagingSenderId: "988732072064",
    appId: "1:988732072064:web:296466ec3b6c31dd7c4665",
    measurementId: "G-SNR1P28KHB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export app, db, and auth
export { app, db, auth };
