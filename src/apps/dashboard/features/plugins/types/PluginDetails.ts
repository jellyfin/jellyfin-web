import type { PluginStatus, VersionInfo } from '@jellyfin/sdk/lib/generated-client';

export interface PluginDetails {
    canUninstall: boolean
    description?: string
    hasConfiguration: boolean
    id: string
    imageUrl?: string
    isEnabled: boolean
    name?: string
    owner?: string
    status?: PluginStatus
    version?: VersionInfo
    versions: VersionInfo[]
}
