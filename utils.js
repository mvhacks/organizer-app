export const serverHost = 'https://api.mvhacks.io';

export function postJSON(url, json) {
    if (!url.includes('http')) {
        url = serverHost + url;
    }
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(json)
    });
}

export function getJSON(url) {
    if (!url.includes('http')) {
        url = serverHost + url;
    }
    return fetch(serverHost + url).then(res => res.json());
}
