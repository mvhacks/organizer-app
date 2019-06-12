import { AsyncStorage } from 'react-native';

export const serverHost = 'https://api.mvhacks.io';

export async function postJSON(url, json, authenticated = false) {
    if (authenticated) {
        authenticated = await AsyncStorage.getItem('token');
    }

    if (!url.includes('http')) {
        url = serverHost + url;
    }
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authentication': 'Bearer ' + authenticated
        },
        body: JSON.stringify(json)
    }).then(res => res.json());
}

export async function getJSON(url, authenticated = false) {
    if (authenticated) {
        authenticated = await AsyncStorage.getItem('token');
    }

    if (!url.includes('http')) {
        url = serverHost + url;
    }
    return fetch(url, {
        headers: {
            'Authentication': 'Bearer ' + authenticated
        }
    }).then(res => res.json());
}
