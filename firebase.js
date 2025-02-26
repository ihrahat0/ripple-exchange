import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration as provided
const firebaseConfig = {
  apiKey: "AIzaSyDOryM3Wo2FOar4Z8b1-VwH6d13bJTgvLY",
  authDomain: "infinitysolution-ddf7d.firebaseapp.com",
  projectId: "infinitysolution-ddf7d",
  storageBucket: "infinitysolution-ddf7d.firebasestorage.app",
  messagingSenderId: "556237630311",
  appId: "1:556237630311:web:c78594281662f5b6d19dc2",
  measurementId: "G-K1DJ7TH9SL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google Authentication Provider
const googleProvider = new GoogleAuthProvider();
// Although you normally do not set client_id in the provider, we include it as requested.
googleProvider.setCustomParameters({
  client_id: '642484459055-r7dpg09r8ne0o92qcsdk07r8i8n63rqn.apps.googleusercontent.com'
});

export { auth, googleProvider }; 