export declare global {
    import { ApiClient, Events } from 'jellyfin-apiclient';
    import {appRouter} from './lib/appRouter';

    interface Window {
        ApiClient: ApiClient;
        Events: Events;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        NativeShell: {
            enableFullscreen: () => void;
            disableFullscreen: () => void;
            openClientSettings: () => void;
            openDownloadManager: () => void;
            openUrl: (url: Parameters<typeof window.open>[0], target?: Parameters<typeof window.open>[1]) => void;
            updateMediaSession: (mediaInfo: unknown) => void;
            hideMediaSession: () => void;
            updateVolumeLevel: (volume: number) => void;
            downloadFiles: (items: unknown[]) => boolean;
            downloadFile: (item: unknown) => boolean;
            getPlugins: () => string[];
            getPlugin: (name: string) => unknown;
            onLocalUserSignedOut: (logoutInfo: { userId: string; }) => void;
            onLocalUserSignedIn: (userId: string, accessToken: string) => void;
            AppHost: {
                getDeviceProfile: (foo1, foo2) => any;
                exit: () => void;
                supports: (feature: string) => boolean;
                getDefaultLayout: () => string;
                init: () => void;
                deviceName: () => string;
                deviceId: () => string;
                appMode: () => string;
                appName: () => string;
                appVersion: () => string;
                screen: () => any;
            };
        };
        Loading: {
            show();
            hide();
        }

        TaskButton: (options: Record<string, any>) => void;
        LibraryMenu: {
            getTopParentId: () => string | null;
            onHardwareMenuButtonClick: () => void;
            setTabs: (type: any, selectedIndex: number, builder: any) => void;
            setDefaultTitle: () => void;
            setTitle: (title: string | null) => void;
            setTransparentMenu: (transparent: boolean) => void
        }

        tizen ?: boolean;
        chrome ?: {
            cast ?: {
                isAvailable: () => boolean;
                getSession: () => any;
                requestSession: () => Promise<any>;
                getCurrentSession: () => any;
            };
        };
        appMode : string;

        Emby ?: {
            Page ?: appRouter
        }
        connectionManager ?: {
            getCurrentUserId: () => string | null;
            getCurrentUser: () => Promise<unknown>;
            getServerInfo: () => Promise<unknown>;
            getApiClient: (id: string) => ApiClient;
            logout: () => Promise<void>;
        };

        clients : {
            openWindow: (url: string, target?: string) => void;
            claim: () => void;
        }
    }


    interface DocumentEventMap {
        'viewshow': CustomEvent;
    }

    const __COMMIT_SHA__: string;
    const __JF_BUILD_VERSION__: string;
    const __PACKAGE_JSON_NAME__: string;
    const __PACKAGE_JSON_VERSION__: string;
    const __USE_SYSTEM_FONTS__: boolean;
    const __WEBPACK_SERVE__: boolean;
}
