import React, { FC, useCallback } from 'react';

import globalize from '../../scripts/globalize';
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

    const getSortMenuOptions = useCallback(() => {
        return [{
            name: globalize.translate('Name'),
            id: 'SortName'
        }, {
            name: globalize.translate('OptionDateAdded'),
            id: 'DateCreated,SortName'
        }];
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
            getSortMenuOptions={getSortMenuOptions}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default CollectionsView;
