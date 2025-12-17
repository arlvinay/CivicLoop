import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with actual project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "civicloop-app.firebaseapp.com",
  projectId: "civicloop-app",
  storageBucket: "civicloop-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);