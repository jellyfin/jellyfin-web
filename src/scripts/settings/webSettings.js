let data;

const urlResolver = document.createElement('a');

// `fetch` with `file:` support
// Recent browsers seem to support `file` protocol under some conditions.
// Based on https://github.com/github/fetch/pull/92#issuecomment-174730593
//          https://github.com/github/fetch/pull/92#issuecomment-512187452
async function fetchLocal(url, options) {
    urlResolver.href = url;

    const requestURL = urlResolver.href;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest;

        xhr.onload = () => {
            // `file` protocol has invalid OK status
            let status = xhr.status;
            if (requestURL.startsWith('file:') && status === 0) {
                status = 200;
            }

            /* eslint-disable-next-line compat/compat */
            resolve(new Response(xhr.responseText, {status: status}));
        };

        xhr.onerror = () => {
            reject(new TypeError('Local request failed'));
        };

        xhr.open('GET', url);

        if (options && options.cache) {
            xhr.setRequestHeader('Cache-Control', options.cache);
        }

        xhr.send(null);
    });
}

async function getConfig() {
    if (data) return Promise.resolve(data);
    try {
        const response = await fetchLocal('config.json', {
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error('network response was not ok');
        }

        data = await response.json();

        return data;
    } catch (error) {
        console.warn('failed to fetch the web config file:', error);
        return getDefaultConfig();
    }
}

async function getDefaultConfig() {
    try {
        const response = await fetchLocal('config.template.json', {
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error('network response was not ok');
        }

        data = await response.json();
        return data;
    } catch (error) {
        console.error('failed to fetch the default web config file:', error);
    }
}

export function getMultiServer() {
    return getConfig().then(config => {
        return config.multiserver;
    }).catch(error => {
        console.log('cannot get web config:', error);
        return false;
    });
}

export function getThemes() {
    return getConfig().then(config => {
        return config.themes;
    }).catch(error => {
        console.log('cannot get web config:', error);
        return [];
    });
}

export function getPlugins() {
    return getConfig().then(config => {
        return config.plugins;
    }).catch(error => {
        console.log('cannot get web config:', error);
        return [];
    });
}

export function getFonts() {
    return getConfig().then(config => {
        return config.fonts;
    }).catch(error => {
        console.log('cannot get web config:', error);
        return [];
    });
}
