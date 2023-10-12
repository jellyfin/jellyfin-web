import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';

import ItemsView from '../../components/library/ItemsView';
import { LibraryViewProps } from 'types/library';
import { CollectionType } from 'types/collectionType';
import { LibraryTab } from 'types/libraryTab';

const CollectionsView: FC<LibraryViewProps> = ({ parentId }) => {
    return (
        <ItemsView
            viewType={LibraryTab.Collections}
            parentId={parentId}
            collectionType={CollectionType.Movies}
            isBtnFilterEnabled={false}
            isBtnNewCollectionEnabled={true}
            isAlphabetPickerEnabled={false}
            itemType={[BaseItemKind.BoxSet]}
            noItemsMessage='MessageNoCollectionsAvailable'
        />
    );
};

export default CollectionsView;
