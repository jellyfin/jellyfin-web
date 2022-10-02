import React, { FC, useCallback } from 'react';

import ViewItemsContainer from '../components/ViewItemsContainer';

interface FavoritesViewI {
    topParentId: string | null;
}

const FavoritesView: FC<FavoritesViewI> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'favorites';
    }, []);

    const getFilterMode = useCallback(() => {
        return 'movies';
    }, []);

    const getItemTypes = useCallback(() => {
        return 'Movie';
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoFavoritesAvailable';
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

export default FavoritesView;
