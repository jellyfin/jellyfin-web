import React, { FC, useCallback } from 'react';

import ViewItemsContainer from 'components/common/ViewItemsContainer';
import { LibraryViewProps } from 'types/library';

const MoviesView: FC<LibraryViewProps> = ({ parentId }) => {
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
            topParentId={parentId}
            isBtnShuffleEnabled={true}
            getBasekey={getBasekey}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default MoviesView;
