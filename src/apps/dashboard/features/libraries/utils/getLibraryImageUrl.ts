import type { VirtualFolderInfo } from '@jellyfin/sdk/lib/generated-client/models/virtual-folder-info';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import dom from 'utils/dom';

const getLibraryImageUrl = (virtualFolder: VirtualFolderInfo) => {
    const apiClient = ServerConnections.currentApiClient();

    if (virtualFolder.PrimaryImageItemId) {
        return apiClient?.getScaledImageUrl(virtualFolder.PrimaryImageItemId, {
            maxWidth: Math.round(dom.getScreenWidth() * 0.40),
            type: 'Primary'
        });
    }
};

export default getLibraryImageUrl;
