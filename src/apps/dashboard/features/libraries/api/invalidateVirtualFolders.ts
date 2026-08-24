import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { VirtualFolderInfo } from '@jellyfin/sdk/lib/generated-client/models/virtual-folder-info';

import { queryClient } from 'utils/query/queryClient';

import { QUERY_KEY } from './useVirtualFolders';

/** Invalidates queries related to libraries/virtual folders. */
export const invalidateVirtualFolders = (user?: UserDto, virtualFolder?: VirtualFolderInfo) => {
    // Admin API - Virtual Folders
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

    if (user) {
        // User API - Views
        void queryClient.invalidateQueries({ queryKey: ['User', user.Id, 'Views'] });

        if (virtualFolder?.ItemId) {
            // Items API - Library children
            void queryClient.invalidateQueries({ queryKey: ['User', user.Id, 'Items', virtualFolder.ItemId] });
        }
    }
};
