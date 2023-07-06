import React, { FC, useCallback } from 'react';

import ViewItemsContainer from 'components/common/ViewItemsContainer';
import { LibraryViewProps } from 'types/library';

const CollectionsView: FC<LibraryViewProps> = ({ parentId }) => {
    const getBasekey = useCallback(() => {
        return 'collections';
    }, []);

    const getItemTypes = useCallback(() => {
        return ['BoxSet'];
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoCollectionsAvailable';
    }, []);

    return (
        <ViewItemsContainer
            topParentId={parentId}
            isBtnFilterEnabled={false}
            isBtnNewCollectionEnabled={true}
            isAlphaPickerEnabled={false}
            getBasekey={getBasekey}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default CollectionsView;
