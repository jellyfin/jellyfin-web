import React, { FC, useCallback } from 'react';

import ViewItemsContainer from '../components/ViewItemsContainer';

interface CollectionsViewI {
    topParentId: string | null;
}

const CollectionsView: FC<CollectionsViewI> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'collections';
    }, []);

    const getFilterMode = useCallback(() => {
        return 'movies';
    }, []);

    const getItemTypes = useCallback(() => {
        return 'BoxSet';
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoCollectionsAvailable';
    }, []);

    return (
        <ViewItemsContainer
            topParentId={topParentId}
            isBtnFilterEnabled={false}
            isBtnNewCollectionEnabled={true}
            isAlphaPickerEnabled={false}
            getBasekey={getBasekey}
            getFilterMode={getFilterMode}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default CollectionsView;
