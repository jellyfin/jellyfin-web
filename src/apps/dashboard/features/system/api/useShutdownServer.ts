import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';

const useShutdownServer = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: () => {
            return getSystemApi(api!)
                .shutdownApplication();
        }
    });
};

export default useShutdownServer;
