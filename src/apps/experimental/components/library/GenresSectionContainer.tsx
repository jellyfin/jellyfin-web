import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import escapeHTML from 'escape-html';
import React, { FC } from 'react';

import { appRouter } from 'components/router/appRouter';
import SectionContainer from './SectionContainer';
import { CollectionType } from 'types/collectionType';

interface GenresSectionContainerProps {
    parentId?: string | null;
    collectionType?: CollectionType;
    itemType: BaseItemKind;
    genre: BaseItemDto;
    items: BaseItemDto[];
}

const GenresSectionContainer: FC<GenresSectionContainerProps> = ({
    parentId,
    collectionType,
    itemType,
    genre,
    items
}) => {
    const getRouteUrl = () => {
        return appRouter.getRouteUrl(genre, {
            context: collectionType,
            parentId: parentId
        });
    };

    return <SectionContainer
        sectionTitle={escapeHTML(genre.Name)}
        items={items ?? []}
        url={getRouteUrl()}
        cardOptions={{
            scalable: true,
            overlayPlayButton: true,
            showTitle: true,
            centerText: true,
            cardLayout: false,
            shape: itemType === BaseItemKind.MusicAlbum ? 'overflowSquare' : 'overflowPortrait',
            showParentTitle: itemType === BaseItemKind.MusicAlbum,
            showYear: itemType !== BaseItemKind.MusicAlbum
        }}
    />;
};

export default GenresSectionContainer;
