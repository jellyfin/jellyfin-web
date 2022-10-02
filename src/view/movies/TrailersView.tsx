
import React, { FC, useCallback } from 'react';

import ViewItemsContainer from '../components/ViewItemsContainer';

interface TrailersViewI {
    topParentId: string | null;
}

const TrailersView: FC<TrailersViewI> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'trailers';
    }, []);

    const getFilterMode = useCallback(() => {
        return 'movies';
    }, []);

    const getItemTypes = useCallback(() => {
        return 'Trailer';
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoTrailersFound';
    }, []);

    return (
        <ViewItemsContainer
            topParentId={topParentId}
            getBasekey={getBasekey}
            getFilterMode={getFilterMode}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default TrailersView;
