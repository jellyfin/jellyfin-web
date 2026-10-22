import { ConnectionMode } from 'lib/jellyfin-apiclient/connectionMode';

interface ServerInfo {
    LastConnectionMode: ConnectionMode;
    LocalAddress?: string;
    ManualAddress?: string;
    RemoteAddress?: string;
}

/** Returns the best server address based on the connection mode. */
export default function getServerAddress(server: ServerInfo) {
    switch (server.LastConnectionMode) {
        case ConnectionMode.Local:
            return server.LocalAddress;
        case ConnectionMode.Manual:
            return server.ManualAddress;
        case ConnectionMode.Remote:
            return server.RemoteAddress;
        default:
            return server.ManualAddress || server.LocalAddress || server.RemoteAddress;
    }
}
