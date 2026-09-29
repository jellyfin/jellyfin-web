import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { LibraryStructureApiRemoveVirtualFolderRequest } from '@jellyfin/sdk/lib/generated-client/api/library-structure-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

import { invalidateVirtualFolders } from './invalidateVirtualFolders';

export const useRemoveVirtualFolder = () => {
    const { api, user } = useApi();
    return useMutation({
        mutationFn: (params: LibraryStructureApiRemoveVirtualFolderRequest) => (
            getLibraryStructureApi(api!)
                .removeVirtualFolder(params)
        ),
        onSuccess: () => {
            invalidateVirtualFolders(user);
        }
    });
};
