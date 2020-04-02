let data;

function getConfig() {
    if (data) return Promise.resolve(data);
    return fetch("/config.json?nocache=" + new Date().getUTCMilliseconds()).then(function (response) {
        return response.json();
    });
}

export function enableMultiServer() {
    return getConfig().then(config => {
        return config.multiserver;
    });
}
