import { AsyncStorage } from 'react-native';
import * as firebase from "firebase/app";
import "firebase/firestore";
const firebaseConfig = {
    apiKey: "AIzaSyBC-DnqYNSMHbCZpretKyO-PGXNQBny858",
    authDomain: "mvhacks-7b384.firebaseapp.com",
    databaseURL: "https://mvhacks-7b384.firebaseio.com",
    projectId: "mvhacks-7b384",
    storageBucket: "mvhacks-7b384.appspot.com",
    messagingSenderId: "538056070445",
    appId: "1:538056070445:web:2151f12cbd03d13b6defa4",
    measurementId: "G-LSPSQPV4VC"
  };
firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();
export const serverHost = 'https://api.mvhacks.io';
export const accentColor = '#3498DB';

export async function postJSON(url, json, authorized = false) {
    if (authorized) {
        authorized = await AsyncStorage.getItem('mvhacks-token');
    }

    if (!url.includes('http')) {
        url = serverHost + url;
    }
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + authorized
        },
        body: JSON.stringify(json)
    }).then(res => res.json());
}

export async function getJSON(url, authorized = false) {
    if (authorized) {
        authorized = await AsyncStorage.getItem('mvhacks-token');
    }

    if (!url.includes('https')) {
        url = serverHost + url;
    }
    return fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authorized
        }
    }).then(res => res.json());
}
