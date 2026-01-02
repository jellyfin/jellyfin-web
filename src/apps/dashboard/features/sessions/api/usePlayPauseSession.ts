import { SessionApiSendPlaystateCommandRequest } from '@jellyfin/sdk/lib/generated-client/api/session-api';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';

export const useSendPlayStateCommand = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: SessionApiSendPlaystateCommandRequest) => (
            getSessionApi(api!)
                .sendPlaystateCommand(params)
        )
    });
};
