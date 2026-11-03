import type { DeviceProfile } from '@jellyfin/sdk/lib/generated-client';

export declare global {
    import type { ApiClient, Events } from 'jellyfin-apiclient';

    interface Window {
        ApiClient: ApiClient;
        Events: Events;
        TaskButton: typeof import('./scripts/taskbutton').default;
        appMode?: string;
        NativeShell?: NativeShell;
        Loading: {
            show();
            hide();
        }
        LibraryMenu?: LibraryMenu;
        tizen?: boolean;
        chrome?: {
            cast?: {
                isAvailable: () => boolean;
                getSession: () => unknown;
                requestSession: () => Promise<unknown>;
                getCurrentSession: () => unknown;
            };
        };
        Emby?: {
            Page?: typeof import('lib/appRouter').appRouter;
        };
        connectionManager?: {
            getCurrentUserId: () => string | null;
            getCurrentUser: () => Promise<unknown>;
            getServerInfo: () => Promise<unknown>;
            getApiClient: (id: string) => ApiClient;
            logout: () => Promise<void>;
        };
    }

    interface DocumentEventMap {
        'viewshow': CustomEvent;
    }

    interface WindowEventMap {
        'command': CustomEvent;
    }

    interface NativeShell {
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
        findServers?: (timeout: number) => Promise<unknown[]>;
        selectServer?: () => void;
        getPlugins: () => string[];
        getPlugin: (name: string) => unknown;
        onLocalUserSignedOut: (logoutInfo: unknown) => void;
        onLocalUserSignedIn: (user: unknown, accessToken: string) => void;
        AppHost?: {
            getDeviceProfile: (profileBuilder: (options: unknown) => unknown, version: string) => DeviceProfile;
            exit: () => void;
            supports: (feature: string) => boolean;
            getDefaultLayout: () => 'mobile' | 'tv' | 'desktop' | 'experimental' | undefined;
            init: () => void;
            deviceName: () => string;
            deviceId: () => string;
            appMode: () => string;
            appName: () => string;
            appVersion: () => string;
            screen: () => unknown;
        };
    }

    interface LibraryMenu {
        getTopParentId: () => string | null;
        onHardwareMenuButtonClick: () => void;
        setTabs: (type: unknown, selectedIndex: number, builder: unknown) => void;
        setDefaultTitle: () => void;
        setTitle: (title: string | null) => void;
        setTransparentMenu: (transparent: boolean) => void;
    }

    const __COMMIT_SHA__: string;
    const __JF_BUILD_VERSION__: string;
    const __PACKAGE_JSON_NAME__: string;
    const __PACKAGE_JSON_VERSION__: string;
    const __USE_SYSTEM_FONTS__: boolean;
    const __WEBPACK_SERVE__: boolean;
}
