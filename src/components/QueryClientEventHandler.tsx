import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, type FC } from 'react';

import { EventType } from 'constants/eventType';
import { useApi } from 'hooks/useApi';
import Events from 'utils/events';

/** Component that handles mapping events to query client actions. */
const QueryClientEventHandler: FC = () => {
    const queryClient = useQueryClient();
    const { user } = useApi();

    const invalidateItemQueries = useCallback(() => (
        queryClient.invalidateQueries({
            queryKey: ['User', user?.Id, 'Items']
        })
    ), [queryClient, user?.Id]);

    useEffect(() => {
        Events.on(document, EventType.REFRESH_NEEDED, invalidateItemQueries);

        return () => {
            Events.off(document, EventType.REFRESH_NEEDED, invalidateItemQueries);
        };
    }, [invalidateItemQueries]);

    return null;
};

export default QueryClientEventHandler;
