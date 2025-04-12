// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDMiqIGjZOG3LO2r65ftz8ObFzzoFLA6ws",
    authDomain: "evoric-da18a.firebaseapp.com",
    databaseURL: "https://evoric-da18a-default-rtdb.firebaseio.com",
    projectId: "evoric-da18a",
    storageBucket: "evoric-da18a.appspot.com",
    messagingSenderId: "253650474048",
    appId: "1:253650474048:web:f02cdb470caf8356803ba5",
    measurementId: "G-V5LMTSDYHQ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const realtimeDB = getDatabase(app); 
const storage = getStorage(app);     

export { auth, realtimeDB, storage };
