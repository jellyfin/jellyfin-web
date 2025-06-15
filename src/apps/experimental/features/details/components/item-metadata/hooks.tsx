import type { NameGuidPair } from '@jellyfin/sdk/lib/generated-client/models/name-guid-pair';
import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models/base-item-person';
import type { ExternalUrl } from '@jellyfin/sdk/lib/generated-client/models/external-url';
import type { DayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/day-of-week';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { useMemo } from 'react';
import {
    getBirthPlace,
    getExternalUrlLinks,
    getGenreLinks,
    getPersonDates,
    getPersonsByTypeLinks,
    getSeriesAirTime,
    getStudioLinks,
    getTagsLinks
} from './utils';

import { ItemKind } from 'types/base/models/item-kind';
import { ItemStatus } from 'types/base/models/item-status';
import type { NullableString } from 'types/base/common/shared/types';
import type { MetadataItem } from './types';

interface UseItemMetadataProps {
    itemType: ItemKind;
    productionLocations: string[];
    externalUrls: ExternalUrl[];
    studios: NameGuidPair[];
    tags: string[];
    genreItems: NameGuidPair[];
    people: BaseItemPerson[];
    airDays: DayOfWeek[];
    airTime: NullableString;
    status: ItemStatus;
    premiereDate?: NullableString;
    endDate?: NullableString;
    serverId?: NullableString;
    context?: CollectionType;
}

export const useItemMetadata = ({
    itemType,
    airDays,
    airTime,
    status,
    productionLocations,
    externalUrls,
    studios,
    premiereDate,
    endDate,
    tags,
    genreItems,
    people,
    serverId,
    context
}: UseItemMetadataProps): MetadataItem[] => {
    return useMemo(() => {
        const metadataItems: MetadataItem[] = [];

        const personDates = getPersonDates(itemType, premiereDate, endDate);

        if (personDates.birth) {
            metadataItems.push(personDates.birth);
        }

        const birthplace = getBirthPlace(itemType, productionLocations);
        if (birthplace?.text || birthplace?.linkItems?.length) {
            metadataItems.push(birthplace);
        }

        if (personDates.death) {
            metadataItems.push(personDates.death);
        }

        const seriesAirTime = getSeriesAirTime(
            itemType,
            airDays,
            airTime,
            status
        );
        if (seriesAirTime) {
            metadataItems.push(seriesAirTime);
        }

        const tagLinks = getTagsLinks(itemType, tags, serverId);
        if (tagLinks) {
            metadataItems.push(tagLinks);
        }

        const externalUrlLinks = getExternalUrlLinks(externalUrls);
        if (externalUrlLinks) {
            metadataItems.push(externalUrlLinks);
        }

        const genreLinks = getGenreLinks(
            itemType,
            genreItems,
            serverId,
            context
        );
        if (genreLinks) {
            metadataItems.push(genreLinks);
        }

        const studioLinks = getStudioLinks(studios, serverId, context);
        if (studioLinks) {
            metadataItems.push(studioLinks);
        }

        const directorLinks = getPersonsByTypeLinks(
            PersonKind.Director,
            people,
            context,
            serverId
        );
        if (directorLinks) {
            metadataItems.push(directorLinks);
        }

        const writerLinks = getPersonsByTypeLinks(
            PersonKind.Writer,
            people,
            context,
            serverId
        );
        if (writerLinks) {
            metadataItems.push(writerLinks);
        }

        return metadataItems;
    }, [
        airDays,
        airTime,
        context,
        endDate,
        externalUrls,
        genreItems,
        itemType,
        people,
        premiereDate,
        productionLocations,
        serverId,
        status,
        studios,
        tags
    ]);
};
