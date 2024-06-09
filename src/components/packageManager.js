import appSettings from '../scripts/settings/appSettings';
import { pluginManager } from './pluginManager';

class PackageManager {
    #packagesList = [];
    #settingsKey = 'installedpackages1';

    init() {
        console.groupCollapsed('loading packages');
        const manifestUrls = JSON.parse(appSettings.get(this.#settingsKey) || '[]');

        return Promise.all(manifestUrls.map((url) => {
            return this.loadPackage(url);
        }))
            .then(() => {
                console.debug('finished loading packages');
                return Promise.resolve();
            })
            .catch(() => {
                return Promise.resolve();
            }).finally(() => {
                console.groupEnd('loading packages');
            });
    }

    get packages() {
        return this.#packagesList.slice(0);
    }

    install(url) {
        return this.loadPackage(url, true).then((pkg) => {
            const manifestUrls = JSON.parse(appSettings.get(this.#settingsKey) || '[]');

            if (!manifestUrls.includes(url)) {
                manifestUrls.push(url);
                appSettings.set(this.#settingsKey, JSON.stringify(manifestUrls));
            }

            return pkg;
        });
    }

    uninstall(name) {
        const pkg = this.#packagesList.filter((p) => {
            return p.name === name;
        })[0];

        if (pkg) {
            this.#packagesList = this.#packagesList.filter((p) => {
                return p.name !== name;
            });

            this.removeUrl(pkg.url);
        }

        return Promise.resolve();
    }

    mapPath(pkg, pluginUrl) {
        const urlLower = pluginUrl.toLowerCase();
        if (urlLower.startsWith('http:') || urlLower.startsWith('https:') || urlLower.startsWith('file:')) {
            return pluginUrl;
        }

        let packageUrl = pkg.url;
        packageUrl = packageUrl.substring(0, packageUrl.lastIndexOf('/'));

        packageUrl += '/';
        packageUrl += pluginUrl;

        return packageUrl;
    }

    addPackage(pkg) {
        this.#packagesList = this.#packagesList.filter((p) => {
            return p.name !== pkg.name;
        });

        this.#packagesList.push(pkg);
    }

    removeUrl(url) {
        let manifestUrls = JSON.parse(appSettings.get(this.#settingsKey) || '[]');

        manifestUrls = manifestUrls.filter((i) => {
            return i !== url;
        });

        appSettings.set(this.#settingsKey, JSON.stringify(manifestUrls));
    }

    loadPackage(url, throwError = false) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const originalUrl = url;
            url += url.indexOf('?') === -1 ? '?' : '&';
            url += 't=' + new Date().getTime();

            xhr.open('GET', url, true);

            const onError = () => {
                if (throwError === true) {
                    reject();
                } else {
                    this.removeUrl(originalUrl);
                    resolve();
                }
            };

            xhr.onload = () => {
                if (this.status < 400) {
                    const pkg = JSON.parse(this.response);
                    pkg.url = originalUrl;

                    this.addPackage(pkg);

                    const plugins = pkg.plugins || [];
                    if (pkg.plugin) {
                        plugins.push(pkg.plugin);
                    }
                    const promises = plugins.map((pluginUrl) => {
                        return pluginManager.loadPlugin(this.mapPath(pkg, pluginUrl));
                    });
                    Promise.all(promises).then(resolve, resolve);
                } else {
                    onError();
                }
            };

            xhr.onerror = onError;

            xhr.send();
        });
    }
}

export default new PackageManager();
