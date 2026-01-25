import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { type LibraryStructureApiRemoveVirtualFolderRequest } from '@jellyfin/sdk/lib/generated-client/api/library-structure-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

export const useRemoveVirtualFolder = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: LibraryStructureApiRemoveVirtualFolderRequest) =>
            getLibraryStructureApi(api!).removeVirtualFolder(params),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['VirtualFolders']
            });
        }
    });
};
