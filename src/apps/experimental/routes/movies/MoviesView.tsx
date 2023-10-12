import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';

import ItemsView from '../../components/library/ItemsView';
import { LibraryViewProps } from 'types/library';
import { CollectionType } from 'types/collectionType';
import { LibraryTab } from 'types/libraryTab';

const MoviesView: FC<LibraryViewProps> = ({ parentId }) => {
    return (
        <ItemsView
            viewType={LibraryTab.Movies}
            parentId={parentId}
            collectionType={CollectionType.Movies}
            isBtnShuffleEnabled={true}
            itemType={[BaseItemKind.Movie]}
            noItemsMessage='MessageNoItemsAvailable'
        />
    );
};

export default MoviesView;
