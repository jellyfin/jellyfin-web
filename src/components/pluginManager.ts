import { ServerConnections } from 'lib/jellyfin-apiclient';
import { safeAppHost } from '../components/apphost';
import confirm from '../components/confirm/confirm';
import toast from '../components/toast/toast';
import globalize from '../lib/globalize';
import * as inputManager from '../scripts/inputManager';
import appSettings from '../scripts/settings/appSettings';
import * as dashboard from '../utils/dashboard';
import Events from '../utils/events';
import { logger } from '../utils/logger';
import loading from './loading/loading';
import { playbackManager } from './playback/playbackmanager';
import { appRouter } from './router/appRouter';

// TODO: replace with each plugin version
const cacheParam = new Date().getTime();

const pluginModules = import.meta.glob('../plugins/*/plugin.{js,ts}');

export interface Plugin {
    id: string;
    name?: string;
    packageName?: string;
    type: string;
    priority?: number;
    installUrl?: string;
    baseUrl?: string;
    getTranslations?: () => any[];
    [key: string]: any;
}

class PluginManager {
    pluginsList: Plugin[] = [];

    get plugins(): Plugin[] {
        return this.pluginsList;
    }

    #loadStrings(plugin: Plugin) {
        const strings = plugin.getTranslations ? plugin.getTranslations() : [];
        return globalize.loadStrings({
            name: plugin.id || plugin.packageName || 'unknown',
            strings: strings
        });
    }

    async #registerPlugin(plugin: Plugin) {
        this.#register(plugin);

        if (plugin.type === 'skin') {
            // translations won't be loaded for skins until needed
            return plugin;
        } else {
            return this.#loadStrings(plugin);
        }
    }

    async #preparePlugin(pluginSpec: any, plugin: Plugin) {
        if (typeof pluginSpec === 'string') {
            // See if it's already installed
            const existing = this.plugins.filter((p) => {
                return p.id === plugin.id;
            })[0];

            if (existing) {
                return pluginSpec;
            }

            plugin.installUrl = pluginSpec;

            const backslash = '\x5c';
            const separatorIndex = Math.max(
                pluginSpec.lastIndexOf('/'),
                pluginSpec.lastIndexOf(backslash)
            );
            plugin.baseUrl = pluginSpec.substring(0, separatorIndex);
        }

        return this.#registerPlugin(plugin);
    }

    async loadPlugin(pluginSpec: any) {
        let plugin: Plugin;

        if (typeof pluginSpec === 'string') {
            if (pluginSpec in window) {
                logger.debug(`Loading plugin (via window): ${pluginSpec}`, {
                    component: 'pluginManager'
                });

                const pluginDefinition = await (window as any)[pluginSpec];
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
                    appHost: safeAppHost,
                    appRouter,
                    inputManager,
                    toast,
                    confirm,
                    dashboard,
                    ServerConnections
                });
            } else {
                logger.debug(`Loading plugin (via dynamic import): ${pluginSpec}`, {
                    component: 'pluginManager'
                });
                const moduleLoader =
                    pluginModules[`../plugins/${pluginSpec}.js`] ||
                    pluginModules[`../plugins/${pluginSpec}.ts`];
                if (!moduleLoader) {
                    throw new Error(`Plugin not found: ${pluginSpec}`);
                }
                const pluginResult: any = await moduleLoader();
                plugin = new pluginResult.default();
            }
        } else if (pluginSpec && typeof pluginSpec.then === 'function') {
            logger.debug('Loading plugin (via promise/async function)', {
                component: 'pluginManager'
            });

            const pluginResult: any = await pluginSpec;
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
    #register(obj: Plugin) {
        this.pluginsList.push(obj);
        Events.trigger(this, 'registered', [obj]);
    }

    ofType(type: string): Plugin[] {
        return this.pluginsList.filter((plugin) => plugin.type === type);
    }

    firstOfType(type: string): Plugin | undefined {
        // Get all plugins of the specified type
        return (
            this.ofType(type)
                // Return the plugin with the "highest" (lowest numeric value) priority
                .sort((p1, p2) => (p1.priority || 0) - (p2.priority || 0))[0]
        );
    }

    mapPath(plugin: Plugin | string, path: string, addCacheParam?: boolean): string {
        let pluginObj: Plugin | undefined;
        if (typeof plugin === 'string') {
            pluginObj = this.pluginsList.filter((p) => {
                return (p.id || p.packageName) === plugin;
            })[0];
        } else {
            pluginObj = plugin;
        }

        if (!pluginObj) return path;

        let url = (pluginObj.baseUrl || '') + '/' + path;

        if (addCacheParam) {
            url += url.includes('?') ? '&' : '?';
            url += 'v=' + cacheParam;
        }

        return url;
    }
}

export const pluginManager = new PluginManager();
