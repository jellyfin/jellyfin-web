function getConfig() {
    return fetch("/config.json?nocache=" + new Date().getUTCMilliseconds()).then(function (response) {
        return response.json();
    });
}

export function enableMultiServer() {
    return getConfig().then(config => {
        return config.multiserver;
    });
}
