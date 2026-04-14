// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeGmhm4fqG1pVmCYyP0YEfO_nPxzX42H8",
  authDomain: "beneshty-48a85.firebaseapp.com",
  projectId: "beneshty-48a85",
  storageBucket: "beneshty-48a85.appspot.com",
  messagingSenderId: "931541905351",
  appId: "1:931541905351:web:9f44f2cae773aef920f3e2",
  measurementId: "G-ML5G82T093"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
 const storage = getStorage(app)
export {db,app,storage}