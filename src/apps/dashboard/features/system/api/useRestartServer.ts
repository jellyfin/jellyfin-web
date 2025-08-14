import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

const useRestartServer = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: () => {
            return getSystemApi(api!).restartApplication();
        }
    });
};

export default useRestartServer;
