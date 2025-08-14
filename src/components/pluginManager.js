import Events from '../utils/events.ts';
import globalize from '../lib/globalize';
import loading from './loading/loading';
import appSettings from '../scripts/settings/appSettings';
import { playbackManager } from './playback/playbackmanager';
import { appHost } from '../components/apphost';
import { appRouter } from './router/appRouter';
import * as inputManager from '../scripts/inputManager';
import toast from '../components/toast/toast';
import confirm from '../components/confirm/confirm';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import * as dashboard from '../utils/dashboard';

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

    async #registerPlugin(plugin) {
        this.#register(plugin);

        if (plugin.type === 'skin') {
            // translations won't be loaded for skins until needed
            return plugin;
        } else {
            return this.#loadStrings(plugin);
        }
    }

    async #preparePlugin(pluginSpec, plugin) {
        if (typeof pluginSpec === 'string') {
            // See if it's already installed
            const existing = this.plugins.filter(function (p) {
                return p.id === plugin.id;
            })[0];

            if (existing) {
                return pluginSpec;
            }

            plugin.installUrl = pluginSpec;

            const separatorIndex = Math.max(
                pluginSpec.lastIndexOf('/'),
                pluginSpec.lastIndexOf('\\')
            );
            plugin.baseUrl = pluginSpec.substring(0, separatorIndex);
        }

        return this.#registerPlugin(plugin);
    }

    async loadPlugin(pluginSpec) {
        let plugin;

        if (typeof pluginSpec === 'string') {
            if (pluginSpec in window) {
                console.log(`Loading plugin (via window): ${pluginSpec}`);

                const pluginDefinition = await window[pluginSpec];
                if (typeof pluginDefinition !== 'function') {
                    throw new TypeError(
                        'Plugin definitions in window have to be an (async) function returning the plugin class'
                    );
                }

                const PluginClass = await pluginDefinition();
                if (typeof PluginClass !== 'function') {
                    throw new TypeError(
                        `Plugin definition doesn't return a class for '${pluginSpec}'`
                    );
                }

                // init plugin and pass basic dependencies
                plugin = new PluginClass({
                    events: Events,
                    loading,
                    appSettings,
                    playbackManager,
                    globalize,
                    appHost,
                    appRouter,
                    inputManager,
                    toast,
                    confirm,
                    dashboard,
                    ServerConnections
                });
            } else {
                console.debug(
                    `Loading plugin (via dynamic import): ${pluginSpec}`
                );
                const pluginResult = await import(
                    /* webpackChunkName: "[request]" */ `../plugins/${pluginSpec}`
                );
                plugin = new pluginResult.default();
            }
        } else if (pluginSpec.then) {
            console.debug('Loading plugin (via promise/async function)');

            const pluginResult = await pluginSpec;
            plugin = new pluginResult.default();
        } else {
            throw new TypeError(
                'Plugins have to be a Promise that resolves to a plugin builder function'
            );
        }

        return this.#preparePlugin(pluginSpec, plugin);
    }

    // In lieu of automatic discovery, plugins will register dynamic objects
    // Each object will have the following properties:
    // name
    // type (skin, screensaver, etc)
    #register(obj) {
        this.pluginsList.push(obj);
        Events.trigger(this, 'registered', [obj]);
    }

    ofType(type) {
        return this.pluginsList.filter((plugin) => plugin.type === type);
    }

    firstOfType(type) {
        // Get all plugins of the specified type
        return (
            this.ofType(type)
                // Return the plugin with the "highest" (lowest numeric value) priority
                .sort((p1, p2) => (p1.priority || 0) - (p2.priority || 0))[0]
        );
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

export const pluginManager = new PluginManager();
