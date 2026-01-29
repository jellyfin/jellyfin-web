import { type LibraryStructureApiRenameVirtualFolderRequest } from '@jellyfin/sdk/lib/generated-client/api/library-structure-api';
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

export const useRenameVirtualFolder = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: LibraryStructureApiRenameVirtualFolderRequest) =>
            getLibraryStructureApi(api!).renameVirtualFolder(params),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['VirtualFolders']
            });
        }
    });
};
