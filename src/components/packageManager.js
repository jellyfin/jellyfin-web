import appSettings from 'appSettings';
import pluginManager from 'pluginManager';
/* eslint-disable indent */

    class PackageManager {
        #packagesList = [];
        #settingsKey = 'installedpackages1';

        init() {
            console.groupCollapsed('loading packages');
            var manifestUrls = JSON.parse(appSettings.get(this.#settingsKey) || '[]');

            var instance = this;
            return Promise.all(manifestUrls.map((u) => {
                return this.loadPackage(instance, u);
            })).then(() => {
                console.groupEnd('loading packages');
                return Promise.resolve();
            }, () => {
                return Promise.resolve();
            });
        }

        get packages() {
            return this.#packagesList.slice(0);
        }

        install(url) {
            return this.loadPackage(this, url, true).then((pkg) => {
                var manifestUrls = JSON.parse(appSettings.get(this.#settingsKey) || '[]');

                if (!manifestUrls.includes(url)) {
                    manifestUrls.push(url);
                    appSettings.set(this.#settingsKey, JSON.stringify(manifestUrls));
                }

                return pkg;
            });
        }

        uninstall(name) {
            var pkg = this.#packagesList.filter((p) => {
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
            var urlLower = pluginUrl.toLowerCase();
            if (urlLower.startsWith('http:') || urlLower.startsWith('https:') || urlLower.startsWith('file:')) {
                return pluginUrl;
            }

            var packageUrl = pkg.url;
            packageUrl = packageUrl.substring(0, packageUrl.lastIndexOf('/'));

            packageUrl += '/';
            packageUrl += pluginUrl;

            return packageUrl;
        }

        addPackage(packageManager, pkg) {
            packageManager.packagesList = packageManager.packagesList.filter((p) => {
                return p.name !== pkg.name;
            });

            packageManager.packagesList.push(pkg);
        }

        removeUrl(url) {
            var manifestUrls = JSON.parse(appSettings.get(this.#settingsKey) || '[]');

            manifestUrls = manifestUrls.filter((i) => {
                return i !== url;
            });

            appSettings.set(this.#settingsKey, JSON.stringify(manifestUrls));
        }

        loadPackage(packageManager, url, throwError) {
            return new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest();
                var originalUrl = url;
                url += url.indexOf('?') === -1 ? '?' : '&';
                url += 't=' + new Date().getTime();

                xhr.open('GET', url, true);

                var onError = () => {
                    if (throwError === true) {
                        reject();
                    } else {
                        this.removeUrl(originalUrl);
                        resolve();
                    }
                };

                xhr.onload = (e) => {
                    if (this.status < 400) {
                        var pkg = JSON.parse(this.response);
                        pkg.url = originalUrl;

                        this.addPackage(packageManager, pkg);

                        var plugins = pkg.plugins || [];
                        if (pkg.plugin) {
                            plugins.push(pkg.plugin);
                        }
                        var promises = plugins.map((pluginUrl) => {
                            return pluginManager.loadPlugin(packageManager.mapPath(pkg, pluginUrl));
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

/* eslint-enable indent */

export default new PackageManager();
