import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

export const useCompleteWizard = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: () => (
            getStartupApi(api!)
                .completeWizard()
        )
    });
};
