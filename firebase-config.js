import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0Txa5vnZbRtYU2wMTb2Qe3heGgF-SV4w",
  authDomain: "ladyvenice.firebaseapp.com",
  projectId: "ladyvenice",
  storageBucket: "ladyvenice.firebasestorage.app",
  messagingSenderId: "143412816674",
  appId: "1:143412816674:web:ce46a0bbee26437722537b"
};

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export Collections
export const colStock = collection(db, "stock");
export const colFinance = collection(db, "finance");
export const colOrders = collection(db, "orders");
export const colTodos = collection(db, "todos");