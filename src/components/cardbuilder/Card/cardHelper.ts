import { Api } from '@jellyfin/sdk';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models/base-item-person';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';

import { appRouter } from '@/components/router/appRouter';
import layoutManager from '@/components/layoutManager';
import itemHelper from '@/components/itemHelper';
import { ItemAction } from '@/constants/itemAction';
import globalize from '@/lib/globalize';
import datetime from '@/scripts/datetime';
import { isUsingLiveTvNaming } from '@/components/cardbuilder/cardBuilderUtils';
import { getDataAttributes } from '@/utils/items';
import { ItemKind } from '@/types/base/models/item-kind';
import { ItemMediaKind } from '@/types/base/models/item-media-kind';
import { ensureArray } from '@/utils/array';

import type { NullableNumber, NullableString } from '@/types/base/common/shared/types';
import type { ItemDto } from '@/types/base/models/item-dto';
import type { CardOptions } from '@/types/cardOptions';
import type { DataAttributes } from '@/types/dataAttributes';

export function getCardLogoUrl(
    item: ItemDto,
    api: Api | undefined,
    cardOptions: CardOptions
) {
    let imgType;
    let imgTag;
    let itemId;
    const logoHeight = 40;

    if (cardOptions.showChannelLogo && item.ChannelPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.ChannelPrimaryImageTag;
        itemId = item.ChannelId;
    } else if (cardOptions.showLogo && item.ParentLogoImageTag) {
        imgType = ImageType.Logo;
        imgTag = item.ParentLogoImageTag;
        itemId = item.ParentLogoItemId;
    }

    if (!itemId) {
        itemId = item.Id;
    }

    if (api && imgTag && imgType && itemId) {
        const response = getImageApi(api).getItemImageUrlById(itemId, imgType, {
            height: logoHeight,
            tag: imgTag
        });

        return {
            logoUrl: response
        };
    }

    return {
        logoUrl: undefined
    };
}

interface TextAction {
    url: string;
    title: string;
    dataAttributes: DataAttributes
}

export interface TextLine {
    title?: NullableString | string[];
    titleAction?: TextAction | TextAction[];
}

export function getTextActionButton(
    item: ItemDto,
    text?: NullableString,
    serverId?: NullableString
): TextLine {
    const title = text || itemHelper.getDisplayName(item);

    if (layoutManager.tv) {
        return {
            title
        };
    }

    const url = appRouter.getRouteUrl(item, { serverId });

    const dataAttributes = getDataAttributes(
        {
            action: ItemAction.Link,
            itemServerId: serverId ?? item.ServerId,
            itemId: item.Id,
            itemChannelId: item.ChannelId,
            itemType: item.Type,
            itemMediaType: item.MediaType,
            itemCollectionType: item.CollectionType,
            itemIsFolder: item.IsFolder
        }
    );

    return {
        titleAction: {
            url,
            title,
            dataAttributes
        }
    };
}

export function getAirTimeText(
    item: ItemDto,
    showAirDateTime: boolean | undefined,
    showAirEndTime: boolean | undefined
) {
    let airTimeText = '';

    if (item.StartDate) {
        try {
            let date = datetime.parseISO8601Date(item.StartDate);

            if (showAirDateTime) {
                airTimeText
                    += datetime.toLocaleDateString(date, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    }) + ' ';
            }

            airTimeText += datetime.getDisplayTime(date);

            if (item.EndDate && showAirEndTime) {
                date = datetime.parseISO8601Date(item.EndDate);
                airTimeText += ' - ' + datetime.getDisplayTime(date);
            }
        } catch {
            console.error('error parsing date: ' + item.StartDate);
        }
    }
    return airTimeText;
}

function isGenreOrStudio(itemType: ItemKind) {
    return itemType === ItemKind.Genre || itemType === ItemKind.Studio;
}

function isMusicGenreOrMusicArtist(
    itemType: ItemKind,
    context: NullableString
) {
    return itemType === ItemKind.MusicGenre || context === 'MusicArtist';
}

function getMovieCount(itemMovieCount: NullableNumber) {
    if (itemMovieCount) {
        return itemMovieCount === 1 ?
            globalize.translate('ValueOneMovie') :
            globalize.translate('ValueMovieCount', itemMovieCount);
    }
}

function getSeriesCount(itemSeriesCount: NullableNumber) {
    if (itemSeriesCount) {
        return itemSeriesCount === 1 ?
            globalize.translate('ValueOneSeries') :
            globalize.translate('ValueSeriesCount', itemSeriesCount);
    }
}

function getEpisodeCount(itemEpisodeCount: NullableNumber) {
    if (itemEpisodeCount) {
        return itemEpisodeCount === 1 ?
            globalize.translate('ValueOneEpisode') :
            globalize.translate('ValueEpisodeCount', itemEpisodeCount);
    }
}

function getAlbumCount(itemAlbumCount: NullableNumber) {
    if (itemAlbumCount) {
        return itemAlbumCount === 1 ?
            globalize.translate('ValueOneAlbum') :
            globalize.translate('ValueAlbumCount', itemAlbumCount);
    }
}

function getSongCount(itemSongCount: NullableNumber) {
    if (itemSongCount) {
        return itemSongCount === 1 ?
            globalize.translate('ValueOneSong') :
            globalize.translate('ValueSongCount', itemSongCount);
    }
}

function getMusicVideoCount(itemMusicVideoCount: NullableNumber) {
    if (itemMusicVideoCount) {
        return itemMusicVideoCount === 1 ?
            globalize.translate('ValueOneMusicVideo') :
            globalize.translate('ValueMusicVideoCount', itemMusicVideoCount);
    }
}

function getRecursiveItemCount(itemRecursiveItemCount: NullableNumber) {
    return itemRecursiveItemCount === 1 ?
        globalize.translate('ValueOneEpisode') :
        globalize.translate('ValueEpisodeCount', itemRecursiveItemCount);
}

function getParentTitle(
    isOuterFooter: boolean,
    serverId: NullableString,
    item: ItemDto
) {
    if (isOuterFooter && item.AlbumArtists?.length) {
        return item.AlbumArtists
            .map(artist => {
                const artistItem: ItemDto = {
                    ...artist,
                    Type: BaseItemKind.MusicArtist,
                    IsFolder: true
                };
                return getTextActionButton(artistItem, null, serverId);
            })
            .reduce((acc, line) => ({
                title: [
                    ...ensureArray(acc.title),
                    ...ensureArray(line.title)
                ],
                titleAction: [
                    ...ensureArray(acc.titleAction),
                    ...ensureArray(line.titleAction)
                ]
            }), {});
    } else {
        return {
            title: isUsingLiveTvNaming(item.Type) ?
                item.Name :
                item.SeriesName
                  || item.Series
                  || item.Album
                  || item.AlbumArtist
                  || ''
        };
    }
}

function getRunTimeTicks(itemRunTimeTicks: NullableNumber) {
    if (itemRunTimeTicks) {
        let minutes = itemRunTimeTicks / 600000000;

        minutes = minutes || 1;

        return globalize.translate('ValueMinutes', Math.round(minutes));
    } else {
        return globalize.translate('ValueMinutes', 0);
    }
}

export function getItemCounts(cardOptions: CardOptions, item: ItemDto) {
    const counts: string[] = [];

    const addCount = (text: NullableString) => {
        if (text) {
            counts.push(text);
        }
    };

    if (item.Type === ItemKind.Playlist) {
        const runTimeTicksText = getRunTimeTicks(item.RunTimeTicks);
        addCount(runTimeTicksText);
    } else if (isGenreOrStudio(item.Type)) {
        const movieCountText = getMovieCount(item.MovieCount);
        addCount(movieCountText);

        const seriesCountText = getSeriesCount(item.SeriesCount);
        addCount(seriesCountText);

        const episodeCountText = getEpisodeCount(item.EpisodeCount);
        addCount(episodeCountText);
    } else if (isMusicGenreOrMusicArtist(item.Type, cardOptions.context)) {
        const albumCountText = getAlbumCount(item.AlbumCount);
        addCount(albumCountText);

        const songCountText = getSongCount(item.SongCount);
        addCount(songCountText);

        const musicVideoCountText = getMusicVideoCount(item.MusicVideoCount);
        addCount(musicVideoCountText);
    } else if (item.Type === ItemKind.Series) {
        const recursiveItemCountText = getRecursiveItemCount(
            item.RecursiveItemCount
        );
        addCount(recursiveItemCountText);
    }

    return counts.join(', ');
}

export function shouldShowTitle(
    showTitle: boolean | string | undefined,
    itemType: ItemKind
) {
    return (
        Boolean(showTitle)
        || itemType === ItemKind.PhotoAlbum
        || itemType === ItemKind.Folder
    );
}

export function shouldShowOtherText(
    isOuterFooter: boolean,
    overlayText: boolean | undefined
) {
    return isOuterFooter ? !overlayText : overlayText;
}

export function shouldShowParentTitleUnderneath(
    itemType: ItemKind
) {
    return (
        itemType === ItemKind.MusicAlbum
        || itemType === ItemKind.Audio
        || itemType === ItemKind.MusicVideo
    );
}

function shouldShowMediaTitle(
    titleAdded: boolean,
    showTitle: boolean,
    forceName: boolean,
    cardOptions: CardOptions,
    textLines: TextLine[]
) {
    let showMediaTitle =
        (showTitle && !titleAdded)
        || (cardOptions.showParentTitleOrTitle && !textLines.length);
    if (!showMediaTitle && !titleAdded && (showTitle || forceName)) {
        showMediaTitle = true;
    }
    return showMediaTitle;
}

function shouldShowExtraType(itemExtraType: NullableString) {
    return !!(itemExtraType && itemExtraType !== 'Unknown');
}

function shouldShowSeriesYearOrYear(
    showYear: string | boolean | undefined,
    showSeriesYear: boolean | undefined
) {
    return Boolean(showYear) || showSeriesYear;
}

function shouldShowCurrentProgram(
    showCurrentProgram: boolean | undefined,
    itemType: ItemKind
) {
    return showCurrentProgram && itemType === ItemKind.TvChannel;
}

function shouldShowCurrentProgramTime(
    showCurrentProgramTime: boolean | undefined,
    itemType: ItemKind
) {
    return showCurrentProgramTime && itemType === ItemKind.TvChannel;
}

function shouldShowPersonRoleOrType(
    showPersonRoleOrType: boolean | undefined,
    item: ItemDto
) {
    return !!(showPersonRoleOrType && (item as BaseItemPerson).Role);
}

function shouldShowParentTitle(
    showParentTitle: boolean | undefined,
    parentTitleUnderneath: boolean
) {
    return showParentTitle && parentTitleUnderneath;
}

function addOtherText(
    cardOptions: CardOptions,
    parentTitleUnderneath: boolean,
    isOuterFooter: boolean,
    item: ItemDto,
    addTextLine: (val: TextLine) => void,
    serverId: NullableString
) {
    if (
        shouldShowParentTitle(
            cardOptions.showParentTitle,
            parentTitleUnderneath
        )
    ) {
        addTextLine(getParentTitle(isOuterFooter, serverId, item));
    }

    if (shouldShowExtraType(item.ExtraType)) {
        addTextLine({ title: globalize.translate(item.ExtraType) });
    }

    if (cardOptions.showItemCounts) {
        addTextLine({ title: getItemCounts(cardOptions, item) });
    }

    if (cardOptions.textLines) {
        addTextLine({ title: getAdditionalLines(cardOptions.textLines, item) });
    }

    if (cardOptions.showSongCount) {
        addTextLine({ title: getSongCount(item.SongCount) });
    }

    if (cardOptions.showPremiereDate) {
        addTextLine({ title: getPremiereDate(item.PremiereDate) });
    }

    if (
        shouldShowSeriesYearOrYear(
            cardOptions.showYear,
            cardOptions.showSeriesYear
        )
    ) {
        addTextLine({ title: getProductionYear(item) });
    }

    if (cardOptions.showRuntime) {
        addTextLine({ title: getRunTime(item.RunTimeTicks) });
    }

    if (cardOptions.showAirTime) {
        addTextLine({
            title: getAirTimeText(
                item,
                cardOptions.showAirDateTime,
                cardOptions.showAirEndTime
            )
        });
    }

    if (cardOptions.showChannelName) {
        addTextLine(getChannelName(item));
    }

    if (shouldShowCurrentProgram(cardOptions.showCurrentProgram, item.Type)) {
        addTextLine({ title: getCurrentProgramName(item.CurrentProgram) });
    }

    if (
        shouldShowCurrentProgramTime(
            cardOptions.showCurrentProgramTime,
            item.Type
        )
    ) {
        addTextLine({ title: getCurrentProgramTime(item.CurrentProgram) });
    }

    if (cardOptions.showSeriesTimerTime) {
        addTextLine({ title: getSeriesTimerTime(item) });
    }

    if (cardOptions.showSeriesTimerChannel) {
        addTextLine({ title: getSeriesTimerChannel(item) });
    }

    if (shouldShowPersonRoleOrType(cardOptions.showCurrentProgramTime, item)) {
        addTextLine({
            title: globalize.translate(
                'PersonRole',
                (item as BaseItemPerson).Role
            )
        });
    }
}

function getSeriesTimerChannel(item: ItemDto) {
    if (item.RecordAnyChannel) {
        return globalize.translate('AllChannels');
    } else {
        return item.ChannelName || '' || globalize.translate('OneChannel');
    }
}

function getSeriesTimerTime(item: ItemDto) {
    if (item.RecordAnyTime) {
        return globalize.translate('Anytime');
    } else {
        return datetime.getDisplayTime(item.StartDate);
    }
}

function getCurrentProgramTime(CurrentProgram: ItemDto | undefined) {
    if (CurrentProgram) {
        return getAirTimeText(CurrentProgram, false, true) || '';
    } else {
        return '';
    }
}

function getCurrentProgramName(CurrentProgram: ItemDto | undefined) {
    if (CurrentProgram) {
        return CurrentProgram.Name;
    } else {
        return '';
    }
}

function getChannelName(item: ItemDto) {
    if (item.ChannelId) {
        return getTextActionButton(
            {
                Id: item.ChannelId,
                ServerId: item.ServerId,
                Name: item.ChannelName,
                Type: ItemKind.TvChannel,
                MediaType: item.MediaType,
                IsFolder: false
            },
            item.ChannelName
        );
    } else {
        return { title: item.ChannelName || '\u00A0' };
    }
}

function getRunTime(itemRunTimeTicks: NullableNumber) {
    if (itemRunTimeTicks) {
        return datetime.getDisplayRunningTime(itemRunTimeTicks);
    } else {
        return '';
    }
}

function getPremiereDate(PremiereDate: string | null | undefined) {
    if (PremiereDate) {
        try {
            return datetime.toLocaleDateString(
                datetime.parseISO8601Date(PremiereDate),
                { weekday: 'long', month: 'long', day: 'numeric' }
            );
        } catch {
            return '';
        }
    } else {
        return '';
    }
}

function getAdditionalLines(
    textLines: (item: ItemDto) => (string | undefined)[],
    item: ItemDto
) {
    const additionalLines = textLines(item);
    for (const additionalLine of additionalLines) {
        return additionalLine;
    }
}

function getProductionYear(item: ItemDto) {
    const productionYear =
        item.ProductionYear
        && datetime.toLocaleString(item.ProductionYear, {
            useGrouping: false
        });
    if (item.Type === ItemKind.Series) {
        if (item.Status === 'Continuing') {
            return globalize.translate(
                'SeriesYearToPresent',
                productionYear || ''
            );
        } else if (item.EndDate && item.ProductionYear) {
            const endYear = datetime.toLocaleString(
                datetime.parseISO8601Date(item.EndDate).getFullYear(),
                { useGrouping: false }
            );
            return (
                productionYear
                + (endYear === productionYear ? '' : ' - ' + endYear)
            );
        } else {
            return productionYear || '';
        }
    } else {
        return productionYear || '';
    }
}

function getMediaTitle(cardOptions: CardOptions, item: ItemDto): TextLine {
    const name =
        cardOptions.showTitle === 'auto'
        && !item.IsFolder
        && item.MediaType === ItemMediaKind.Photo ?
            '' :
            itemHelper.getDisplayName(item, {
                includeParentInfo: cardOptions.includeParentInfoInTitle
            });

    return getTextActionButton({
        Id: item.Id,
        ServerId: item.ServerId,
        Name: name,
        Type: item.Type,
        CollectionType: item.CollectionType,
        IsFolder: item.IsFolder
    });
}

function getParentTitleOrTitle(
    isOuterFooter: boolean,
    item: ItemDto,
    setTitleAdded: (val: boolean) => void,
    showTitle: boolean
): TextLine {
    if (
        isOuterFooter
        && item.Type === ItemKind.Episode
        && item.SeriesName
    ) {
        if (item.SeriesId) {
            return getTextActionButton({
                Id: item.SeriesId,
                ServerId: item.ServerId,
                Name: item.SeriesName,
                Type: ItemKind.Series,
                IsFolder: true
            });
        } else {
            return { title: item.SeriesName };
        }
    } else if (isUsingLiveTvNaming(item.Type)) {
        if (!item.EpisodeTitle && !item.IndexNumber) {
            setTitleAdded(true);
        }
        return { title: item.Name };
    } else {
        const parentTitle =
            item.SeriesName
            || item.Series
            || item.Album
            || item.AlbumArtist
            || '';

        if (parentTitle || showTitle) {
            return { title: parentTitle };
        }

        return { title: '' };
    }
}

interface TextLinesOpts {
    isOuterFooter: boolean;
    overlayText: boolean | undefined;
    forceName: boolean;
    item: ItemDto;
    cardOptions: CardOptions;
    imgUrl: string | undefined;
}

export function getCardTextLines({
    isOuterFooter,
    overlayText,
    forceName,
    item,
    cardOptions,
    imgUrl
}: TextLinesOpts) {
    const showTitle = shouldShowTitle(cardOptions.showTitle, item.Type);
    const showOtherText = shouldShowOtherText(isOuterFooter, overlayText);
    const serverId = item.ServerId || cardOptions.serverId;
    let textLines: TextLine[] = [];
    const parentTitleUnderneath = shouldShowParentTitleUnderneath(item.Type);

    let titleAdded = false;
    const addTextLine = (val: TextLine) => {
        textLines.push(val);
    };

    const setTitleAdded = (val: boolean) => {
        titleAdded = val;
    };

    if (
        showOtherText
        && (cardOptions.showParentTitle || cardOptions.showParentTitleOrTitle)
        && !parentTitleUnderneath
    ) {
        addTextLine(
            getParentTitleOrTitle(isOuterFooter, item, setTitleAdded, showTitle)
        );
    }

    const showMediaTitle = shouldShowMediaTitle(
        titleAdded,
        showTitle,
        forceName,
        cardOptions,
        textLines
    );

    if (showMediaTitle) {
        addTextLine(getMediaTitle(cardOptions, item));
    }

    if (showOtherText) {
        addOtherText(
            cardOptions,
            parentTitleUnderneath,
            isOuterFooter,
            item,
            addTextLine,
            serverId
        );
    }

    if (
        (showTitle || !imgUrl)
        && forceName
        && overlayText
        && textLines.length === 1
    ) {
        textLines = [];
    }

    if (overlayText && showTitle) {
        textLines = [{ title: item.Name }];
    }

    return {
        textLines
    };
}
