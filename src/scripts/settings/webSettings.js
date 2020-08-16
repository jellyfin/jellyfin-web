
let data;

async function getConfig() {
    if (data) return Promise.resolve(data);
    try {
        data = await import('../../config.json');

        console.dir(data);
        return data;
    } catch (error) {
        console.warn('failed to fetch the web config file:', error);
        return getDefaultConfig();
    }
}

async function getDefaultConfig() {
    try {
        data = await import('../../config.template.json');

        console.dir(data);
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
