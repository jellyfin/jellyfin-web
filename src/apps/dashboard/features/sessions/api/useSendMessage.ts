import { SessionApiSendMessageCommandRequest } from '@jellyfin/sdk/lib/generated-client/api/session-api';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

export const useSendMessage = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: SessionApiSendMessageCommandRequest) => (
            getSessionApi(api!)
                .sendMessageCommand(params)
        )
    });
};
