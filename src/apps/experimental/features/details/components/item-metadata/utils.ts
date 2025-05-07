import type { NameGuidPair } from '@jellyfin/sdk/lib/generated-client/models/name-guid-pair';
import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models/base-item-person';
import type { ExternalUrl } from '@jellyfin/sdk/lib/generated-client/models/external-url';
import type { DayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/day-of-week';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { intervalToDuration } from 'date-fns';
import globalize from 'lib/globalize';
import { appHost } from 'components/apphost';
import { appRouter } from 'components/router/appRouter';
import { pluralizeLabel } from 'utils/pluralizeLabel';

import type { NullableString } from 'types/base/common/shared/types';
import { safeParseDate } from 'utils/safeParseDate';
import { ItemKind } from 'types/base/models/item-kind';
import { ItemStatus } from 'types/base/models/item-status';
import type { MetadataItem } from './types';

export const getCollectionTypeForItem = (itemType: ItemKind) => {
    switch (itemType) {
        case ItemKind.Movie:
        case ItemKind.BoxSet: {
            return CollectionType.Movies;
        }
        case ItemKind.Series:
        case ItemKind.Season:
        case ItemKind.Episode: {
            return CollectionType.Tvshows;
        }
        case ItemKind.MusicArtist:
        case ItemKind.MusicAlbum:
        case ItemKind.Audio:
        case ItemKind.AudioBook: {
            return CollectionType.Music;
        }
        case ItemKind.Program: {
            return CollectionType.Livetv;
        }
        default: {
            return null;
        }
    }
};

export const getSeriesAirTime = (
    itemType: ItemKind,
    airDays: DayOfWeek[],
    airTime: NullableString,
    status: ItemStatus
): MetadataItem | null => {
    if (itemType !== ItemKind.Series) return null;

    if (!airDays.length) return null;

    const airTimeInfo = {
        labelKey: status === ItemStatus.Ended ? 'Aired ' : 'Airs ',
        text:
            airDays.length === 7 ?
                'daily' :
                airDays
                    .map((a) => pluralizeLabel(airDays.length, a))
                    .join(',')
    };

    if (airTime) {
        airTimeInfo.text += ` at ${airTime}`;
    }

    return airTimeInfo;
};

type DateType = 'birth' | 'death';

export const getPersonDateInfo = (
    dateType: DateType,
    itemType: ItemKind,
    premiereDate?: NullableString,
    endDate?: NullableString
): MetadataItem | null => {
    if (itemType !== ItemKind.Person) return null;

    const isBirthDate = dateType === 'birth';
    const targetDate = isBirthDate ? premiereDate : endDate;

    const date = safeParseDate(targetDate);
    if (!date) return null;

    const personInfo = {
        labelKey: isBirthDate ? 'Born' : 'Died',
        text: date.toLocaleDateString()
    };

    if (isBirthDate) {
        const deathDate = safeParseDate(endDate);
        const ageDuration = intervalToDuration({
            start: date,
            end: deathDate || Date.now()
        });

        if (!deathDate) {
            personInfo.text += ` ${globalize.translate(
                'AgeValue',
                ageDuration.years
            )}`;
        }
    } else {
        const birthDate = safeParseDate(premiereDate);
        if (birthDate) {
            const ageDuration = intervalToDuration({
                start: birthDate,
                end: date
            });
            personInfo.text += ` ${globalize.translate(
                'AgeValue',
                ageDuration.years
            )}`;
        }
    }

    return personInfo;
};

interface PersonDates {
    birth: MetadataItem | null;
    death: MetadataItem | null;
}

export const getPersonDates = (
    itemType: ItemKind,
    premiereDate?: NullableString,
    endDate?: NullableString
): PersonDates => ({
    birth: getPersonDateInfo('birth', itemType, premiereDate, endDate),
    death: getPersonDateInfo('death', itemType, premiereDate, endDate)
});

export const getBirthPlace = (
    itemType: ItemKind,
    productionLocations: string[]
): MetadataItem | null => {
    const hasExternalLinks = appHost.supports('externallinks');
    const [primaryLocation] = productionLocations;

    if (itemType !== ItemKind.Person || !primaryLocation) {
        return null;
    }

    return {
        labelKey: 'BirthPlace',
        ...(hasExternalLinks ?
            {
                linkItems: [
                    {
                        url: `https://www.openstreetmap.org/search?query=${encodeURIComponent(
                            primaryLocation
                        )}`,
                        text: primaryLocation
                    }
                ]
            } :
            { text: primaryLocation })
    };
};

export const getTagsLinks = (
    itemType: ItemKind,
    tags: string[],
    serverId?: NullableString
): MetadataItem | null => {
    if (itemType === ItemKind.Program) return null;

    if (!tags.length) return null;

    return {
        labelKey: pluralizeLabel(tags.length, 'Tag'),
        linkItems: tags.map((tag) => ({
            url: appRouter.getRouteUrl('tag', {
                tag: tag,
                serverId: serverId
            }),
            text: tag
        }))
    };
};

export const getPersonsByTypeLinks = (
    personType: PersonKind,
    people: BaseItemPerson[],
    context?: CollectionType,
    serverId?: NullableString
): MetadataItem | null => {
    const persons = people.filter((p) => p.Type === personType);

    if (!persons.length) return null;

    return {
        labelKey: pluralizeLabel(persons.length, personType),
        linkItems: persons.map((person) => ({
            url: appRouter.getRouteUrl(
                {
                    Name: person.Name,
                    Type: ItemKind.Person,
                    ServerId: serverId,
                    Id: person.Id
                },
                {
                    context: context
                }
            ),
            text: person.Name || ''
        }))
    };
};

export const getGenreLinks = (
    itemType: ItemKind,
    genreItems: NameGuidPair[],
    serverId?: NullableString,
    context?: CollectionType
): MetadataItem | null => {
    if (!genreItems.length) return null;
    const contextType = context || getCollectionTypeForItem(itemType);

    return {
        labelKey: pluralizeLabel(genreItems.length, 'Genre'),
        linkItems: genreItems.map((genreItem) => ({
            url: appRouter.getRouteUrl(
                {
                    Name: genreItem.Name,
                    Type:
                        contextType === CollectionType.Music ?
                            ItemKind.MusicGenre :
                            ItemKind.Genre,
                    ServerId: serverId,
                    Id: genreItem.Id
                },
                {
                    context: contextType
                }
            ),
            text: genreItem.Name || ''
        }))
    };
};

export const getExternalUrlLinks = (
    externalUrls: ExternalUrl[]
): MetadataItem | null => {
    if (!externalUrls.length) return null;

    return {
        labelKey: 'HeaderExternalIds',
        linkItems: externalUrls?.map((url) => ({
            url: url.Url || '',
            text: url.Name || ''
        }))
    };
};

export const getStudioLinks = (
    studios: NameGuidPair[],
    serverId?: NullableString,
    context?: CollectionType
): MetadataItem | null => {
    if (!studios.length) return null;

    return {
        labelKey: pluralizeLabel(studios.length, 'Studio'),
        linkItems: studios.map((studio) => ({
            url: appRouter.getRouteUrl(
                {
                    Name: studio.Name,
                    Type: ItemKind.Studio,
                    ServerId: serverId,
                    Id: studio.Id
                },
                {
                    context: context
                }
            ),
            text: studio.Name || ''
        }))
    };
};
