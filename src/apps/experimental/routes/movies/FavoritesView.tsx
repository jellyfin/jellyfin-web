import React, { FC, useCallback } from 'react';

import ViewItemsContainer from 'components/common/ViewItemsContainer';
import { LibraryViewProps } from 'types/library';

const FavoritesView: FC<LibraryViewProps> = ({ parentId }) => {
    const getBasekey = useCallback(() => {
        return 'favorites';
    }, []);

    const getItemTypes = useCallback(() => {
        return ['Movie'];
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoFavoritesAvailable';
    }, []);

    return (
        <ViewItemsContainer
            topParentId={parentId}
            getBasekey={getBasekey}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default FavoritesView;
