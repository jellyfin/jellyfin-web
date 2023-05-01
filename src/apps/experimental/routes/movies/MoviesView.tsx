import React, { FC, useCallback } from 'react';

import ViewItemsContainer from '../../../../components/common/ViewItemsContainer';
import { LibraryViewProps } from '../../../../types/interface';

const MoviesView: FC<LibraryViewProps> = ({ topParentId }) => {
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
