import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';

import { queryClient } from 'utils/query/queryClient';

import { QUERY_KEY } from './useVirtualFolders';

/** Invalidates queries related to libraries/virtual folders. */
export const invalidateVirtualFolders = (user?: UserDto) => {
    // Admin API - Virtual Folders
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

    if (user) {
        // User API - Views
        void queryClient.invalidateQueries({ queryKey: ['User', user.Id, 'Views'] });
    }
};
