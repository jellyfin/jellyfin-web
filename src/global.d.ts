export declare global {
    import { ApiClient, Events } from 'jellyfin-apiclient';

    interface Window {
        ApiClient: ApiClient;
        Events: Events;
        NativeShell: any;
    }
}
