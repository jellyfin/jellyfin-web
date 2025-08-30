import type {
    ConfigurationPageInfo,
    PluginStatus,
    VersionInfo
} from '@jellyfin/sdk/lib/generated-client';

export interface PluginDetails {
    canUninstall: boolean;
    category?: string;
    description?: string;
    id: string;
    imageUrl?: string;
    isEnabled: boolean;
    name?: string;
    owner?: string;
    configurationPage?: ConfigurationPageInfo;
    status?: PluginStatus;
    version?: VersionInfo;
    versions: VersionInfo[];
}
