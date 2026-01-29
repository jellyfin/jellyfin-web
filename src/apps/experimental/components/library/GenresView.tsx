import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';
import type { ParentId } from 'types/library';
import GenresItemsContainer from './GenresItemsContainer';

interface GenresViewProps {
    parentId: ParentId;
    collectionType: CollectionType | undefined;
    itemType: BaseItemKind[];
}

const GenresView: FC<GenresViewProps> = ({ parentId, collectionType, itemType }) => {
    return (
        <GenresItemsContainer
            parentId={parentId}
            collectionType={collectionType}
            itemType={itemType}
        />
    );
};

export default GenresView;
