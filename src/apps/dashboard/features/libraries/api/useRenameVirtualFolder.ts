import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { LibraryStructureApiRenameVirtualFolderRequest } from '@jellyfin/sdk/lib/generated-client/api/library-structure-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

import { invalidateVirtualFolders } from './invalidateVirtualFolders';

export const useRenameVirtualFolder = () => {
    const { api, user } = useApi();
    return useMutation({
        mutationFn: (params: LibraryStructureApiRenameVirtualFolderRequest) => (
            getLibraryStructureApi(api!)
                .renameVirtualFolder(params)
        ),
        onSuccess: () => {
            invalidateVirtualFolders(user);
        }
    });
};
