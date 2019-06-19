import { AsyncStorage } from 'react-native';

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

    if (!url.includes('http')) {
        url = serverHost + url;
    }
    return fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authorized
        }
    }).then(res => res.json());
}
