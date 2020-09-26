import * as firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseApp = firebase.initializeApp({
    piKey: "AIzaSyArIUAhJm9WVX6IfF7xUOq35b-vVueI_C0",
    authDomain: "panther-trace.firebaseapp.com",
    databaseURL: "https://panther-trace.firebaseio.com",
    projectId: "panther-trace",
    storageBucket: "panther-trace.appspot.com",
    messagingSenderId: "1015911724082",
    appId: "1:1015911724082:web:d7e6195cabd5e644b4f82b"
});

const db = firebaseApp.firestore();

export { db };