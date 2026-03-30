import React, { type FC } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import type { NameGuidPair } from '@jellyfin/sdk/lib/generated-client/models/name-guid-pair';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinkButton from 'elements/emby-button/LinkButton';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';

interface ItemDetailsMetadataListProps {
    item: BaseItemDto;
    type: BaseItemKind | PersonKind;
    context: string;
}

const ItemDetailsMetadataList: FC<ItemDetailsMetadataListProps> = ({
    type,
    item,
    context
}) => {
    const items = getMetadataItems(type, item);

    if (!items?.length) {
        return null;
    }

    return (
        <Box className='detailsGroupItem'>
            <Typography className='label'>
                {getLabel(type, items.length)}
            </Typography>
            <Box className='focuscontainer-x'>
                {items.map((metadataItem, index) => (
                    <Box key={item.Id} component='span'>
                        {index > 0 ? ', ' : ''}
                        <LinkButton href={getLink(type, item, context, metadataItem)} className='button-link' style={{ color: 'inherit' }}>
                            {metadataItem.Name}
                        </LinkButton>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

function getLabel(type: BaseItemKind | PersonKind, itemCount: number): string | null {
    switch (type) {
        case PersonKind.Author:
            return globalize.translate(itemCount > 1 ? 'Authors' : 'Author');
        case PersonKind.Director:
            return globalize.translate(itemCount > 1 ? 'Directors' : 'Director');
        case PersonKind.Writer:
            return globalize.translate(itemCount > 1 ? 'Writers' : 'Writer');
        case BaseItemKind.Studio:
            return globalize.translate(itemCount > 1 ? 'Studios' : 'Studio');
        case BaseItemKind.Genre:
            return globalize.translate(itemCount > 1 ? 'Genres' : 'Genre');
    }

    return null;
}

function getLink(type: BaseItemKind | PersonKind, item: BaseItemDto, context: string, metadataItem: NameGuidPair): string {
    const stubItem = {
        Id: metadataItem.Id,
        Name: metadataItem.Name,
        Type: getRouteType(type, context),
        ServerId: item.ServerId
    };

    return appRouter.getRouteUrl(stubItem, { context });
}

function getRouteType(type: BaseItemKind | PersonKind, context: string): string | null {
    switch (type) {
        case PersonKind.Author:
        case PersonKind.Director:
        case PersonKind.Writer:
            return 'Person';
        case BaseItemKind.Studio:
            return 'Studio';
        case BaseItemKind.Genre:
            return context === 'music' ? 'MusicGenre' : 'Genre';
    }

    return null;
}

function getMetadataItems(type: BaseItemKind | PersonKind, item: BaseItemDto): NameGuidPair[] | null {
    if (item.Type === BaseItemKind.BoxSet || item.Type === BaseItemKind.Playlist) {
        return null;
    }

    switch (type) {
        case PersonKind.Author:
        case PersonKind.Director:
        case PersonKind.Writer:
            return item.People?.filter(person => person.Type === type).map(person => ({ Id: person.Id, Name: person.Name })) ?? null;
        case BaseItemKind.Studio:
            return item.Studios ?? null;
        case BaseItemKind.Genre:
            return item.GenreItems ?? null;
    }

    return null;
}

export default ItemDetailsMetadataList;
