import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwEad7lijYOKtBJ-w7AOE_6Ul5_Q0OMXo",
  authDomain: "crud-project-ea415.firebaseapp.com",
  databaseURL: "https://crud-project-ea415-default-rtdb.firebaseio.com",
  projectId: "crud-project-ea415",
  storageBucket: "crud-project-ea415.firebasestorage.app",
  messagingSenderId: "678694459372",
  appId: "1:678694459372:web:d6ca4c8125ce77f0cb52c9",
  measurementId: "G-5MN0HTQXR5"
};
firebase.initializeApp(firebaseConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


