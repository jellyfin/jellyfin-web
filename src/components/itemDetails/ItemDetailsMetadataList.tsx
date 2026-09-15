import React, { type FC } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import type { NameGuidPair } from '@jellyfin/sdk/lib/generated-client/models/name-guid-pair';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CompanyKind } from '@jellyfin/sdk/lib/generated-client/models/company-kind';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinkButton from 'elements/emby-button/LinkButton';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';

type MetadataType = BaseItemKind | PersonKind | CompanyKind;

interface ItemDetailsMetadataListProps {
    item: BaseItemDto;
    type: MetadataType;
    context: string;
}

// One label per kind of company, so a network reads as a network rather than as a studio.
const companyLabels: Record<CompanyKind, [string, string]> = {
    [CompanyKind.Studio]: ['Studio', 'Studios'],
    [CompanyKind.Network]: ['Network', 'Networks'],
    [CompanyKind.Label]: ['Label', 'Labels'],
    [CompanyKind.Publisher]: ['Publisher', 'Publishers']
};

const isCompanyType = (type: MetadataType): type is CompanyKind =>
    type in companyLabels;

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
                    <Box key={metadataItem.Id} component='span'>
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

function getLabel(type: MetadataType, itemCount: number): string | null {
    if (isCompanyType(type)) {
        const [singular, plural] = companyLabels[type];
        return globalize.translate(itemCount > 1 ? plural : singular);
    }

    switch (type) {
        case PersonKind.Author:
            return globalize.translate(itemCount > 1 ? 'Authors' : 'Author');
        case PersonKind.Creator:
            return globalize.translate(itemCount > 1 ? 'Creators' : 'Creator');
        case PersonKind.Director:
            return globalize.translate(itemCount > 1 ? 'Directors' : 'Director');
        case PersonKind.Writer:
            return globalize.translate(itemCount > 1 ? 'Writers' : 'Writer');
        case BaseItemKind.Genre:
            return globalize.translate(itemCount > 1 ? 'Genres' : 'Genre');
    }

    return null;
}

function getLink(type: MetadataType, item: BaseItemDto, context: string, metadataItem: NameGuidPair): string {
    const stubItem = {
        Id: metadataItem.Id,
        Name: metadataItem.Name,
        Type: getRouteType(type, context),
        ServerId: item.ServerId
    };

    return appRouter.getRouteUrl(stubItem, { context });
}

function getRouteType(type: MetadataType, context: string): string | null {
    if (isCompanyType(type)) {
        return BaseItemKind.Company;
    }

    switch (type) {
        case PersonKind.Author:
        case PersonKind.Creator:
        case PersonKind.Director:
        case PersonKind.Writer:
            return 'Person';
        case BaseItemKind.Genre:
            return context === 'music' ? 'MusicGenre' : 'Genre';
    }

    return null;
}

function getMetadataItems(type: MetadataType, item: BaseItemDto): NameGuidPair[] | null {
    if (isCompanyType(type)) {
        if (item.Type === BaseItemKind.BoxSet || item.Type === BaseItemKind.Playlist) {
            return null;
        }

        return item.Companies
            ?.filter(company => company.Type === type)
            .map(company => ({ Id: company.Id, Name: company.Name })) ?? null;
    }

    switch (type) {
        case PersonKind.Author:
        case PersonKind.Creator:
        case PersonKind.Director:
        case PersonKind.Writer:
            return item.People?.filter(person => person.Type === type).map(person => ({ Id: person.Id, Name: person.Name })) ?? null;
        case BaseItemKind.Genre:
            return item.GenreItems ?? null;
    }

    return null;
}

export default ItemDetailsMetadataList;
