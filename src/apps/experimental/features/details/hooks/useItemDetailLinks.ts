import type { NameGuidPair } from '@jellyfin/sdk/lib/generated-client/models/name-guid-pair';
import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models/base-item-person';
import type { ExternalUrl } from '@jellyfin/sdk/lib/generated-client/models/external-url';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { useMemo } from 'react';
import { intervalToDuration } from 'date-fns';
import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';
import { appHost } from 'components/apphost';
import { appRouter } from 'components/router/appRouter';

import { ItemKind } from 'types/base/models/item-kind';
import type { NullableString } from 'types/base/common/shared/types';
import type { ItemDto } from 'types/base/models/item-dto';
import type { LinkItem, LinkItemList } from '../types/LinkItemList';

function getTagLinks(
    itemTags: string[] | null,
    itemType: ItemKind,
    itemServerId: NullableString
) {
    const links: LinkItem[] = [];

    if (itemTags?.length && itemType !== ItemKind.Program) {
        for (const tag of itemTags) {
            links.push({
                href: appRouter.getRouteUrl('tag', {
                    tag,
                    serverId: itemServerId
                }),
                title: tag
            });
        }
    }

    return links;
}

function getExternalUrlLinks(itemExternalUrls: ExternalUrl[] | null) {
    const links: LinkItem[] = [];

    if (itemExternalUrls?.length) {
        for (const externalUrl of itemExternalUrls) {
            links.push({
                href: externalUrl.Url || '',
                title: externalUrl.Name || '',
                target: '_blank',
                rel: 'noopener noreferrer'
            });
        }
    }

    return links;
}

function inferContext(itemType: ItemKind) {
    if (itemType === ItemKind.Movie || itemType === ItemKind.BoxSet) {
        return CollectionType.Movies;
    }

    if (
        itemType === ItemKind.Series
        || itemType === ItemKind.Season
        || itemType === ItemKind.Episode
    ) {
        return CollectionType.Tvshows;
    }

    if (
        itemType === ItemKind.MusicArtist
        || itemType === ItemKind.MusicAlbum
        || itemType === ItemKind.Audio
        || itemType === ItemKind.AudioBook
    ) {
        return CollectionType.Music;
    }

    if (itemType === ItemKind.Program) {
        return CollectionType.Livetv;
    }

    return null;
}

function getGenreLinks(
    itemGenreItems: NameGuidPair[] | null,
    itemType: ItemKind,
    context?: CollectionType,
    itemServerId?: NullableString
) {
    const contextType = context || inferContext(itemType);

    const links: LinkItem[] = [];

    if (itemGenreItems?.length) {
        for (const genreItem of itemGenreItems) {
            links.push({
                href: appRouter.getRouteUrl(
                    {
                        Name: genreItem.Name,
                        Type:
                            contextType === CollectionType.Music ?
                                ItemKind.MusicGenre :
                                ItemKind.Genre,
                        ServerId: itemServerId,
                        Id: genreItem.Id
                    },
                    {
                        context: contextType
                    }
                ),
                title: genreItem.Name || ''
            });
        }
    }

    return links;
}

function getStudioLinks(
    itemStudios: NameGuidPair[] | null,
    context?: CollectionType,
    itemServerId?: NullableString
) {
    const links: LinkItem[] = [];

    if (itemStudios?.length) {
        for (const studio of itemStudios) {
            links.push({
                href: appRouter.getRouteUrl(
                    {
                        Name: studio.Name,
                        Type: ItemKind.Studio,
                        ServerId: itemServerId,
                        Id: studio.Id
                    },
                    {
                        context: context
                    }
                ),
                title: studio.Name || ''
            });
        }
    }

    return links;
}

function getPersonsByTypeLinks(
    itemPeople: BaseItemPerson[] | null,
    personType: PersonKind,
    context?: CollectionType,
    itemServerId?: NullableString
) {
    const persons = (itemPeople || []).filter(function (person) {
        return person.Type === personType;
    });
    const links: LinkItem[] = [];

    if (persons) {
        for (const person of persons) {
            links.push({
                href: appRouter.getRouteUrl(
                    {
                        Name: person.Name,
                        Type: ItemKind.Person,
                        ServerId: itemServerId,
                        Id: person.Id
                    },
                    {
                        context: context
                    }
                ),
                title: person.Name || ''
            });
        }
    }

    return links;
}

function getBirthDayText(
    itemType: ItemKind,
    itemPremiereDate: NullableString,
    itemEndDate: NullableString
) {
    let text;

    if (itemType == ItemKind.Person && itemPremiereDate) {
        const birthday = datetime.parseISO8601Date(itemPremiereDate, true);
        const durationSinceBorn = intervalToDuration({
            start: birthday,
            end: Date.now()
        });
        if (itemEndDate) {
            text = birthday.toLocaleDateString();
        } else {
            text = `${birthday.toLocaleDateString()} ${globalize.translate(
                'AgeValue',
                durationSinceBorn.years
            )}`;
        }
    }

    return text;
}

function getBirthPlaceTextoRLinks(
    itemType: ItemKind,
    itemProductionLocations: string[] | null
) {
    let text;
    const links: LinkItem[] = [];

    if (itemType == ItemKind.Person && itemProductionLocations?.length) {
        if (appHost.supports('externallinks')) {
            links.push({
                href: `https://www.openstreetmap.org/search?query=${encodeURIComponent(
                    itemProductionLocations[0]
                )}`,
                title: itemProductionLocations[0],
                target: '_blank',
                rel: 'noopener noreferrer'
            });
        } else {
            text = itemProductionLocations[0];
        }
    }

    return {
        text,
        links
    };
}

function getDeathDateText(
    itemType: ItemKind,
    itemPremiereDate: NullableString,
    itemEndDate: NullableString
) {
    let text;

    if (itemType == ItemKind.Person && itemEndDate) {
        const deathday = datetime.parseISO8601Date(itemEndDate, true);
        if (itemPremiereDate) {
            const birthday = datetime.parseISO8601Date(itemPremiereDate, true);
            const durationSinceBorn = intervalToDuration({
                start: birthday,
                end: deathday
            });

            text = `${deathday.toLocaleDateString()} ${globalize.translate(
                'AgeValue',
                durationSinceBorn.years
            )}`;
        } else {
            text = deathday.toLocaleDateString();
        }
    }

    return text;
}

interface UseItemDetailLinksProps {
    item: ItemDto;
    context?: CollectionType;
}

function useItemDetailLinks({
    item,
    context
}: UseItemDetailLinksProps): LinkItemList[] {
    const {
        ProductionLocations = [],
        ExternalUrls = [],
        Tags = [],
        Studios = [],
        GenreItems = [],
        People = [],
        PremiereDate,
        EndDate,
        Type,
        ServerId
    } = item;

    const birthDayText = useMemo(
        () => getBirthDayText(Type, PremiereDate, EndDate),
        [EndDate, PremiereDate, Type]
    );

    const birthPlaceTextoRLinks = useMemo(
        () => getBirthPlaceTextoRLinks(Type, ProductionLocations),
        [ProductionLocations, Type]
    );

    const deathDateText = useMemo(
        () => getDeathDateText(Type, PremiereDate, EndDate),
        [EndDate, PremiereDate, Type]
    );

    const tagLinks = useMemo(
        () => getTagLinks(Tags, Type, ServerId),
        [ServerId, Tags, Type]
    );

    const genreLinks = useMemo(
        () => getGenreLinks(GenreItems, Type, context, ServerId),
        [GenreItems, ServerId, Type, context]
    );

    const studioLinks = useMemo(
        () => getStudioLinks(Studios, context, ServerId),
        [ServerId, Studios, context]
    );

    const externalUrlLinks = useMemo(
        () => getExternalUrlLinks(ExternalUrls),
        [ExternalUrls]
    );

    const directorLinks = useMemo(
        () =>
            getPersonsByTypeLinks(
                People,
                PersonKind.Director,
                context,
                ServerId
            ),
        [People, ServerId, context]
    );

    const writerLinks = useMemo(
        () =>
            getPersonsByTypeLinks(People, PersonKind.Writer, context, ServerId),
        [People, ServerId, context]
    );

    return [
        { label: 'Born', text: birthDayText },
        { label: 'BirthPlace', text: birthPlaceTextoRLinks.text, links: birthPlaceTextoRLinks.links },
        { label: 'Died', text: deathDateText },
        { label: 'LabelTag', links: tagLinks },
        { label: 'HeaderExternalIds', links: externalUrlLinks },
        { label: genreLinks.length > 1 ? 'Genres' : 'Genre', links: genreLinks },
        { label: studioLinks.length > 1 ? 'Studios' : 'Studio', links: studioLinks },
        { label: directorLinks.length > 1 ? 'Directors' : 'Director', links: directorLinks },
        { label: writerLinks.length > 1 ? 'Writers' : 'Writer', links: writerLinks }
    ];
}

export default useItemDetailLinks;
