let data;

function getConfig() {
    if (data) return Promise.resolve(data);
    return fetch("/config.json?nocache=" + new Date().getUTCMilliseconds()).then(function (response) {
        data = response.json();
        return data;
    });
}

export function enableMultiServer() {
    return getConfig().then(config => {
        return config.multiserver;
    });
}
