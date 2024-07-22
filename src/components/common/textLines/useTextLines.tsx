import type { NameGuidPair } from '@jellyfin/sdk/lib/generated-client/models/name-guid-pair';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import itemHelper from '../../itemHelper';
import datetime from 'scripts/datetime';
import { appRouter } from 'components/router/appRouter';
import type { ItemDto } from 'types/base/models/item-dto';
import type { TextAction, TextLine, TextLineOpts } from './types';

function getParentTitle(
    item: ItemDto,
    showParentTitle: boolean | undefined,
    parentTitleWithTitle: boolean | undefined,
    displayName: string | null | undefined
) {
    let parentTitle;
    if (showParentTitle) {
        if (item.Type === BaseItemKind.Season || item.Type === BaseItemKind.Episode) {
            parentTitle = item.SeriesName;
        } else if (item.IsSeries || (item.EpisodeTitle && item.Name)) {
            parentTitle = item.Name;
        }
    }
    if (showParentTitle && parentTitleWithTitle) {
        if (displayName && parentTitle) {
            parentTitle += ' - ';
        }
        parentTitle = (parentTitle ?? '') + displayName;
    }
    return parentTitle;
}

function getNameOrIndexWithName(
    item: ItemDto,
    includeParentInfoInTitle: boolean | undefined,
    showIndexNumber: boolean | undefined
) {
    let displayName = itemHelper.getDisplayName(item, {
        includeParentInfo: includeParentInfoInTitle
    });

    if (showIndexNumber && item.IndexNumber != null) {
        displayName = `${item.IndexNumber}. ${displayName}`;
    }
    return displayName;
}

function getArtistLinks(artists: NameGuidPair[]): TextAction[] {
    const titleActions = [];

    for (const artist of artists) {
        const url = appRouter.getRouteUrl(artist, {
            itemType: 'MusicArtist'
        });

        titleActions.push({
            url,
            title: artist.Name || ''
        });
    }

    return titleActions;
}

interface UseTextLinesProps {
    item: ItemDto;
    textLineOpts?: TextLineOpts;
}

function useTextLines({ item, textLineOpts = {} }: UseTextLinesProps) {
    const {
        showProgramDateTime,
        showProgramTime,
        showChannel,
        showParentTitle,
        showIndexNumber,
        parentTitleWithTitle,
        showArtist,
        showCurrentProgram,
        includeParentInfoInTitle
    } = textLineOpts;

    const textLines: TextLine[] = [];

    const addTextLine = (textLine: TextLine) => {
        if (textLine) {
            textLines.push(textLine);
        }
    };

    const addProgramDateTime = () => {
        if (showProgramDateTime) {
            const programDateTime = datetime.toLocaleString(
                datetime.parseISO8601Date(item.StartDate),
                {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                }
            );
            addTextLine({ title: programDateTime });
        }
    };

    const addProgramTime = () => {
        if (showProgramTime) {
            const programTime = datetime.getDisplayTime(
                datetime.parseISO8601Date(item.StartDate)
            );
            addTextLine({ title: programTime });
        }
    };

    const addChannelName = () => {
        if (showChannel && item.ChannelName) {
            addTextLine({ title: item.ChannelName });
        }
    };

    const displayName = getNameOrIndexWithName(item, includeParentInfoInTitle, showIndexNumber);

    const parentTitle = getParentTitle(item, showParentTitle, parentTitleWithTitle, displayName );

    const addParentTitle = () => {
        if (parentTitle) {
            addTextLine({ title: parentTitle });
        }
    };

    const addDisplayName = () => {
        if (displayName && !parentTitleWithTitle) {
            addTextLine({ title: displayName });
        }
    };

    const addAlbumArtistOrArtists = () => {
        if (item.IsFolder && showArtist !== false) {
            if (item.AlbumArtist && item.Type === BaseItemKind.MusicAlbum) {
                addTextLine({ title: item.AlbumArtist });
            }
        } else if (showArtist) {
            const artistItems = item.ArtistItems;
            // if (artistItems && item.Type !== BaseItemKind.MusicAlbum) {
            //     const artists = artistItems.map((a) => a.Name).join(', ');
            //     addTextLine({ title: artists });
            // }
            if (artistItems && item.Type) {
                addTextLine({ titleAction: getArtistLinks(artistItems) });
            }
        }
    };

    const addCurrentProgram = () => {
        if (item.Type === BaseItemKind.TvChannel && item.CurrentProgram && showCurrentProgram !== false) {
            const currentProgram = itemHelper.getDisplayName(item.CurrentProgram, {
                includeParentInfo: includeParentInfoInTitle
            });

            addTextLine({ title: currentProgram });
        }
    };

    addProgramDateTime();
    addProgramTime();
    addChannelName();
    addParentTitle();
    addDisplayName();
    addAlbumArtistOrArtists();
    addCurrentProgram();

    return {
        textLines
    };
}

export default useTextLines;
