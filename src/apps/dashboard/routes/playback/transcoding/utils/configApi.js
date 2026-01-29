import { QUERY_KEY } from 'hooks/useNamedConfiguration';
import { queryClient } from 'utils/query/queryClient';

export async function updateTranscodingConfig(data) {
    const api = ServerConnections.getCurrentApi();

    await getConfigurationApi(api).updateNamedConfiguration({ key: QUERY_KEY, body: data });

    void queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, CONFIG_KEY]
    });
}
