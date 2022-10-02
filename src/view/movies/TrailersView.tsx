
import React, { FC, useCallback } from 'react';

import ViewItemsContainer from '../components/ViewItemsContainer';

interface TrailersViewI {
    topParentId: string | null;
}

const TrailersView: FC<TrailersViewI> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'trailers';
    }, []);

    const getItemTypes = useCallback(() => {
        return ['Trailer'];
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoTrailersFound';
    }, []);

    return (
        <ViewItemsContainer
            topParentId={topParentId}
            getBasekey={getBasekey}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default TrailersView;
