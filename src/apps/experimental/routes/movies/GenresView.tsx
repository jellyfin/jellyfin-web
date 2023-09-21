import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';

import GenresItemsContainer from '../../components/library/GenresItemsContainer';
import { LibraryViewProps } from 'types/library';
import { CollectionType } from 'types/collectionType';

const GenresView: FC<LibraryViewProps> = ({ parentId }) => {
    return (
        <GenresItemsContainer
            parentId={parentId}
            collectionType={CollectionType.Movies}
            itemType={BaseItemKind.Movie}
        />
    );
};

export default GenresView;
