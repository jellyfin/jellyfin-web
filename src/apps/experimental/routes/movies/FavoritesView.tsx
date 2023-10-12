import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';

import ItemsView from '../../components/library/ItemsView';
import { LibraryViewProps } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const FavoritesView: FC<LibraryViewProps> = ({ parentId }) => {
    return (
        <ItemsView
            viewType={LibraryTab.Favorites}
            parentId={parentId}
            itemType={[BaseItemKind.Movie]}
            noItemsMessage='MessageNoFavoritesAvailable'
        />
    );
};

export default FavoritesView;
