define(['events', 'globalize'], function (events, globalize) {
    'use strict';

    // TODO: replace with each plugin version
    var cacheParam = new Date().getTime();

    function loadStrings(plugin) {
        var strings = plugin.getTranslations ? plugin.getTranslations() : [];
        return globalize.loadStrings({
            name: plugin.id || plugin.packageName,
            strings: strings
        });
    }

    function definePluginRoute(pluginManager, route, plugin) {

        route.contentPath = pluginManager.mapPath(plugin, route.path);
        route.path = pluginManager.mapRoute(plugin, route);

        Emby.App.defineRoute(route, plugin.id);
    }

    function PluginManager() {

        this.pluginsList = [];
    }

    PluginManager.prototype.loadPlugin = function(pluginSpec) {

        var instance = this;

        function registerPlugin(plugin) {
            instance.register(plugin);

            if (plugin.getRoutes) {
                plugin.getRoutes().forEach(function (route) {
                    definePluginRoute(instance, route, plugin);
                });
            }

            if (plugin.type === 'skin') {

                // translations won't be loaded for skins until needed
                return Promise.resolve(plugin);
            } else {
                return new Promise((resolve, reject) => {
                    loadStrings(plugin)
                        .then(function () {
                            resolve(plugin);
                        })
                        .catch(reject);
                });
            }
        }

        if (typeof pluginSpec === 'string') {
            console.debug('Loading plugin (via deprecated requirejs method): ' + pluginSpec);

            return new Promise(function (resolve, reject) {
                require([pluginSpec], (pluginFactory) => {
                    var plugin = pluginFactory.default ? new pluginFactory.default() : new pluginFactory();

                    // See if it's already installed
                    var existing = instance.pluginsList.filter(function (p) {
                        return p.id === plugin.id;
                    })[0];

                    if (existing) {
                        resolve(pluginSpec);
                    }

                    plugin.installUrl = pluginSpec;

                    var separatorIndex = Math.max(pluginSpec.lastIndexOf('/'), pluginSpec.lastIndexOf('\\'));
                    plugin.baseUrl = pluginSpec.substring(0, separatorIndex);

                    var paths = {};
                    paths[plugin.id] = plugin.baseUrl;

                    requirejs.config({
                        waitSeconds: 0,
                        paths: paths
                    });

                    registerPlugin(plugin).then(resolve).catch(reject);
                });
            });
        } else if (pluginSpec.then) {
            return pluginSpec.then(pluginBuilder => {
                return pluginBuilder();
            }).then(plugin => {
                console.debug(`Plugin loaded: ${plugin.id}`);
                return registerPlugin(plugin);
            });
        } else {
            const err = new Error('Plugins have to be a Promise that resolves to a plugin builder function or a requirejs urls (deprecated)');
            console.error(err);
            return Promise.reject(err);
        }
    };

    // In lieu of automatic discovery, plugins will register dynamic objects
    // Each object will have the following properties:
    // name
    // type (skin, screensaver, etc)
    PluginManager.prototype.register = function (obj) {

        this.pluginsList.push(obj);
        events.trigger(this, 'registered', [obj]);
    };

    PluginManager.prototype.ofType = function (type) {

        return this.pluginsList.filter(function (o) {
            return o.type === type;
        });
    };

    PluginManager.prototype.plugins = function () {
        return this.pluginsList;
    };

    PluginManager.prototype.mapRoute = function (plugin, route) {

        if (typeof plugin === 'string') {
            plugin = this.pluginsList.filter(function (p) {
                return (p.id || p.packageName) === plugin;
            })[0];
        }

        route = route.path || route;

        if (route.toLowerCase().indexOf('http') === 0) {
            return route;
        }

        return '/plugins/' + plugin.id + '/' + route;
    };

    PluginManager.prototype.mapPath = function (plugin, path, addCacheParam) {

        if (typeof plugin === 'string') {
            plugin = this.pluginsList.filter(function (p) {
                return (p.id || p.packageName) === plugin;
            })[0];
        }

        var url = plugin.baseUrl + '/' + path;

        if (addCacheParam) {
            url += url.indexOf('?') === -1 ? '?' : '&';
            url += 'v=' + cacheParam;
        }

        return url;
    };

    return new PluginManager();
});
