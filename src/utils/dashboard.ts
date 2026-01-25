/**
 * @deprecated This module provides legacy dashboard utilities.
 *
 * Migration:
 * - Replace Dashboard.alert() with Toast component or confirm dialog
 * - Replace Dashboard.navigate() with React Router useNavigate()
 * - Replace Dashboard.confirm() with TanStack Query confirm dialog
 * - Replace pageClassOn/pageIdOn with React event handlers
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import { appHost, safeAppHost } from 'components/apphost';
import viewContainer from 'components/viewContainer';
import { AppFeature } from 'constants/appFeature';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import loading from '../components/loading/loading';
import { appRouter } from '../components/router/appRouter';
import baseConfirm from '../components/confirm/confirm';
import globalize from '../lib/globalize';
import * as webSettings from '../scripts/settings/webSettings';
import datetime from '../scripts/datetime';
import { setBackdropTransparency } from '../components/backdrop/backdrop';
import DirectoryBrowser from '../components/directorybrowser/directorybrowser';
import dialogHelper from '../components/dialogHelper/dialogHelper';
import itemIdentifier from '../components/itemidentifier/itemidentifier';
import { getLocationSearch } from './url';
import { queryClient } from './query/queryClient';
import { logger } from './logger';

declare global {
    interface Window {
        ApiClient: any;
        Dashboard: any;
        appMode?: string;
        NativeShell?: any;
    }
    const ApiClient: any;
}

export function getCurrentUser() {
    return window.ApiClient.getCurrentUser(false);
}

// TODO: investigate url prefix support for serverAddress function
export async function serverAddress(): Promise<string | undefined> {
    const apiClient = window.ApiClient;

    if (apiClient) {
        return Promise.resolve(apiClient.serverAddress());
    }

    // Use servers specified in config.json
    const servers = await webSettings.getServers();

    // Extract URLs from server objects (config.json uses Server objects with ManualAddress/LocalAddress)
    const urls: string[] = servers
        .map((server: { ManualAddress?: string; LocalAddress?: string; RemoteAddress?: string }) => {
            return server.ManualAddress || server.LocalAddress || server.RemoteAddress || '';
        })
        .filter(Boolean);

    if (urls.length === 0) {
        // Otherwise use computed base URL
        let url: string;
        const index = window.location.href.toLowerCase().lastIndexOf('/web');
        if (index !== -1) {
            url = window.location.href.substring(0, index);
        } else {
            // fallback to location without path
            url = window.location.origin;
        }

        // Don't use bundled app URL (file:) as server URL
        if (url.startsWith('file:')) {
            return Promise.resolve(undefined);
        }

        // Don't use the current origin as server URL since that's where the client is hosted
        if (url === window.location.origin) {
            return Promise.resolve(undefined);
        }

        urls.push(url);
    }

    logger.debug('URL candidates:', { component: 'Dashboard', urls });

    const promises = urls.map((url: string) => {
        return fetch(`${url}/System/Info/Public`, { cache: 'no-cache' })
            .then(async resp => {
                if (!resp.ok) {
                    return;
                }

                let config: unknown;
                try {
                    config = await resp.json();
                } catch {
                    return;
                }

                return {
                    url,
                    config
                };
            })
            .catch(error => {
                logger.error('Error fetching server info', { component: 'Dashboard', url }, error);
            });
    });

    return Promise.all(promises)
        .then(responses => {
            return (responses as any[]).filter(obj => obj?.config);
        })
        .then(configs => {
            const selection = configs.find(obj => !obj.config.StartupWizardCompleted) || configs[0];
            const selectedUrl = selection?.url;

            // In development mode, skip localhost URLs as they're the dev server, not the Jellyfin server
            if (import.meta.env.DEV && selectedUrl) {
                try {
                    const urlObj = new URL(selectedUrl);
                    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                        logger.warn('Skipping localhost URL in development mode', {
                            component: 'Dashboard',
                            url: selectedUrl
                        });
                        return undefined;
                    }
                } catch {
                    return undefined;
                }
            }

            return selectedUrl;
        })
        .catch(error => {
            logger.error('Error selecting server address', { component: 'Dashboard' }, error);
            return undefined;
        });
}

export function getCurrentUserId() {
    const apiClient = window.ApiClient;

    if (apiClient) {
        return apiClient.getCurrentUserId();
    }

    return null;
}

export function onServerChanged(_userId: string, _accessToken: string, apiClient: any) {
    ServerConnections.setLocalApiClient(apiClient);
}

export function logout() {
    ServerConnections.logout().then(() => {
        // Clear the query cache
        queryClient.clear();
        // Reset cached views
        viewContainer.reset();
        safeAppHost.supports(AppFeature.MultiServer) ? navigate('selectserver') : navigate('login');
    });
}

export function getPluginUrl(name: string) {
    return 'configurationpage?name=' + encodeURIComponent(name);
}

export function getConfigurationResourceUrl(name: string) {
    return window.ApiClient.getUrl('web/ConfigurationPage', {
        name: name
    });
}

/**
 * Navigate to a url.
 */
export function navigate(url: string, preserveQueryString?: boolean): Promise<void> {
    if (!url) {
        throw new Error('url cannot be null or empty');
    }

    const queryString = getLocationSearch();

    if (preserveQueryString && queryString) {
        url += queryString;
    }

    return appRouter.show(url);
}

export function processPluginConfigurationUpdateResult() {
    loading.hide();
    logger.info('Plugin configuration saved', { component: 'Dashboard' });
}

export function processServerConfigurationUpdateResult() {
    loading.hide();
    logger.info('Server configuration saved', { component: 'Dashboard' });
}

export function processErrorResponse(response: Response) {
    loading.hide();

    let status = '' + response.status;

    if (response.statusText) {
        status = response.statusText;
    }

    logger.error(`Server error: ${status}`, {
        component: 'Dashboard',
        statusCode: response.status,
        errorCode: response.headers ? response.headers.get('X-Application-Error-Code') : null,
        url: response.url
    });
}

export function alert(options: string | { title?: string; message?: string; callback?: () => void }) {
    if (typeof options === 'string') {
        logger.info(options, { component: 'Dashboard' });
    } else {
        if (options.callback) {
            options.callback();
        }
        logger.warn(options.message || options.title || globalize.translate('HeaderAlert'), {
            component: 'Dashboard',
            title: options.title || globalize.translate('HeaderAlert')
        });
    }
}

export function capabilities(host: any) {
    return Object.assign(
        {
            PlayableMediaTypes: ['Audio', 'Video'],
            SupportedCommands: [
                'MoveUp',
                'MoveDown',
                'MoveLeft',
                'MoveRight',
                'PageUp',
                'PageDown',
                'PreviousLetter',
                'NextLetter',
                'ToggleOsd',
                'ToggleContextMenu',
                'Select',
                'Back',
                'SendKey',
                'SendString',
                'GoHome',
                'GoToSettings',
                'VolumeUp',
                'VolumeDown',
                'Mute',
                'Unmute',
                'ToggleMute',
                'SetVolume',
                'SetAudioStreamIndex',
                'SetSubtitleStreamIndex',
                'DisplayContent',
                'GoToSearch',
                'DisplayMessage',
                'SetRepeatMode',
                'SetShuffleQueue',
                'ChannelUp',
                'ChannelDown',
                'PlayMediaSource',
                'PlayTrailers'
            ],
            SupportsPersistentIdentifier: window.appMode === 'cordova' || window.appMode === 'android',
            SupportsMediaControl: true
        },
        host?.getPushTokenInfo ? host.getPushTokenInfo() : safeAppHost?.getPushTokenInfo?.() || {}
    );
}

export function selectServer() {
    if (window.NativeShell && typeof window.NativeShell.selectServer === 'function') {
        window.NativeShell.selectServer();
    } else {
        navigate('selectserver');
    }
}

export function hideLoadingMsg() {
    loading.hide();
}

export function showLoadingMsg() {
    loading.show();
}

export function confirm(message: string, title: string, callback: (result: boolean) => void) {
    baseConfirm(message, title)
        .then(() => {
            callback(true);
        })
        .catch(() => {
            callback(false);
        });
}

export const pageClassOn = function (
    eventName: string,
    className: string,
    fn: (this: HTMLElement, event: Event) => void
) {
    document.addEventListener(eventName, event => {
        const target = event.target as HTMLElement;

        if (target.classList.contains(className)) {
            fn.call(target, event);
        }
    });
};

export const pageIdOn = function (eventName: string, id: string, fn: (this: HTMLElement, event: Event) => void) {
    document.addEventListener(eventName, event => {
        const target = event.target as HTMLElement;

        if (target.id === id) {
            fn.call(target, event);
        }
    });
};

const Dashboard = {
    alert,
    capabilities,
    confirm,
    getPluginUrl,
    getConfigurationResourceUrl,
    getCurrentUser,
    getCurrentUserId,
    hideLoadingMsg,
    logout,
    navigate,
    onServerChanged,
    processErrorResponse,
    processPluginConfigurationUpdateResult,
    processServerConfigurationUpdateResult,
    selectServer,
    serverAddress,
    showLoadingMsg,
    datetime,
    DirectoryBrowser,
    dialogHelper,
    itemIdentifier,
    setBackdropTransparency
};

// This is used in plugins and templates, so keep it defined for now.
// TODO: Remove once plugins don't need it
if (typeof window !== 'undefined') {
    window.Dashboard = Dashboard;
}

export { Dashboard };
export default Dashboard;
