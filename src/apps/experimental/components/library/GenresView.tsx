import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import GenresItemsContainer from './GenresItemsContainer';
import { ParentId } from 'types/library';
import { CollectionType } from 'types/collectionType';

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
