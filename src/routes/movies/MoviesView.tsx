import React, { FC, useCallback } from 'react';

import ViewItemsContainer from '../../components/common/ViewItemsContainer';

interface MoviesViewI {
    topParentId: string | null;
}

const MoviesView: FC<MoviesViewI> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'movies';
    }, []);

    const getItemTypes = useCallback(() => {
        return ['Movie'];
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoItemsAvailable';
    }, []);

    return (
        <ViewItemsContainer
            topParentId={topParentId}
            isBtnShuffleEnabled={true}
            getBasekey={getBasekey}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default MoviesView;
