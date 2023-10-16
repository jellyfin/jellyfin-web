import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';

import ItemsView from '../../components/library/ItemsView';
import { LibraryViewProps } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const TrailersView: FC<LibraryViewProps> = ({ parentId }) => {
    return (
        <ItemsView
            viewType={LibraryTab.Trailers}
            parentId={parentId}
            itemType={[BaseItemKind.Trailer]}
            noItemsMessage='MessageNoTrailersFound'
        />
    );
};

export default TrailersView;
