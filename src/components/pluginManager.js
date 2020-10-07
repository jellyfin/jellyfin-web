import events from 'events';
import globalize from 'globalize';
/* eslint-disable indent */

    // TODO: replace with each plugin version
    const cacheParam = new Date().getTime();

    class PluginManager {
        pluginsList = [];

        get plugins() {
            return this.pluginsList;
        }

        #loadStrings(plugin) {
            const strings = plugin.getTranslations ? plugin.getTranslations() : [];
            return globalize.loadStrings({
                name: plugin.id || plugin.packageName,
                strings: strings
            });
        }

        #definePluginRoute(route, plugin) {
            route.contentPath = this.mapPath(plugin, route.path);
            route.path = this.#mapRoute(plugin, route);

            Emby.App.defineRoute(route, plugin.id);
        }

        #registerPlugin(plugin) {
            this.#register(plugin);

            if (plugin.getRoutes) {
                plugin.getRoutes().forEach((route) => {
                    this.#definePluginRoute(route, plugin);
                });
            }

            if (plugin.type === 'skin') {
                // translations won't be loaded for skins until needed
                return Promise.resolve(plugin);
            } else {
                return new Promise((resolve, reject) => {
                    this.#loadStrings(plugin)
                        .then(function () {
                            resolve(plugin);
                        })
                        .catch(reject);
                });
            }
        }

        loadPlugin(pluginSpec) {
            if (typeof pluginSpec === 'string') {
                console.debug('Loading plugin (via deprecated requirejs method): ' + pluginSpec);

                return new Promise((resolve, reject) => {
                    require([pluginSpec], (pluginFactory) => {
                        const plugin = pluginFactory.default ? new pluginFactory.default() : new pluginFactory();

                        // See if it's already installed
                        const existing = this.pluginsList.filter(function (p) {
                            return p.id === plugin.id;
                        })[0];

                        if (existing) {
                            resolve(pluginSpec);
                        }

                        plugin.installUrl = pluginSpec;

                        const separatorIndex = Math.max(pluginSpec.lastIndexOf('/'), pluginSpec.lastIndexOf('\\'));
                        plugin.baseUrl = pluginSpec.substring(0, separatorIndex);

                        const paths = {};
                        paths[plugin.id] = plugin.baseUrl;

                        requirejs.config({
                            waitSeconds: 0,
                            paths: paths
                        });

                        this.#registerPlugin(plugin).then(resolve).catch(reject);
                    });
                });
            } else if (pluginSpec.then) {
                return pluginSpec.then(pluginBuilder => {
                    return pluginBuilder();
                }).then((plugin) => {
                    console.debug(`Plugin loaded: ${plugin.id}`);
                    return this.#registerPlugin(plugin);
                });
            } else {
                const err = new TypeError('Plugins have to be a Promise that resolves to a plugin builder function or a RequireJS url (deprecated)');
                console.error(err);
                return Promise.reject(err);
            }
        }

        // In lieu of automatic discovery, plugins will register dynamic objects
        // Each object will have the following properties:
        // name
        // type (skin, screensaver, etc)
        #register(obj) {
            this.pluginsList.push(obj);
            events.trigger(this, 'registered', [obj]);
        }

        ofType(type) {
            return this.pluginsList.filter((o) => {
                return o.type === type;
            });
        }

        #mapRoute(plugin, route) {
            if (typeof plugin === 'string') {
                plugin = this.pluginsList.filter((p) => {
                    return (p.id || p.packageName) === plugin;
                })[0];
            }

            route = route.path || route;

            if (route.toLowerCase().startsWith('http')) {
                return route;
            }

            return '/plugins/' + plugin.id + '/' + route;
        }

        mapPath(plugin, path, addCacheParam) {
            if (typeof plugin === 'string') {
                plugin = this.pluginsList.filter((p) => {
                    return (p.id || p.packageName) === plugin;
                })[0];
            }

            let url = plugin.baseUrl + '/' + path;

            if (addCacheParam) {
                url += url.includes('?') ? '&' : '?';
                url += 'v=' + cacheParam;
            }

            return url;
        }
    }

/* eslint-enable indent */

export default new PluginManager();
