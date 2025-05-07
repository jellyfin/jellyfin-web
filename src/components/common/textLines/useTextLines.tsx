import itemHelper from '../../itemHelper';
import datetime from 'scripts/datetime';
import type { ItemDto } from 'types/base/models/item-dto';
import type { TextLine, TextLineOpts } from './types';
import { ItemKind } from 'types/base/models/item-kind';

function getParentTitle(
    item: ItemDto,
    showParentTitle: boolean | undefined,
    parentTitleWithTitle: boolean | undefined,
    displayName: string | null | undefined
) {
    let parentTitle;
    if (showParentTitle) {
        if (item.Type === ItemKind.Season || item.Type === ItemKind.Episode) {
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
    showIndexNumber?: boolean,
    includeParentInfoInTitle?: boolean,
    includeIndexNumber?: boolean
) {
    let displayName = itemHelper.getDisplayName(item, {
        includeParentInfo: includeParentInfoInTitle,
        includeIndexNumber
    });

    if (showIndexNumber && item.IndexNumber != null) {
        displayName = `${item.IndexNumber}. ${displayName}`;
    }
    return displayName;
}

interface UseTextLinesProps {
    item: ItemDto;
    textLineOpts?: TextLineOpts;
}

function useTextLines({ item, textLineOpts = {} }: UseTextLinesProps) {
    const {
        showTitle = true,
        showProgramDateTime = false,
        showProgramTime = false,
        showChannel = false,
        showParentTitle = false,
        showIndexNumber = false,
        parentTitleWithTitle = false,
        showArtist = true,
        showCurrentProgram = true,
        includeParentInfoInTitle = true,
        includeIndexNumber = true
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

    const displayName = getNameOrIndexWithName(item, showIndexNumber, includeParentInfoInTitle, includeIndexNumber);

    const parentTitle = getParentTitle(item, showParentTitle, parentTitleWithTitle, displayName );

    const addParentTitle = () => {
        if (parentTitle) {
            addTextLine({ title: parentTitle });
        }
    };

    const addDisplayName = () => {
        if (displayName && !parentTitleWithTitle && showTitle) {
            addTextLine({ title: displayName });
        }
    };

    const addAlbumArtistOrArtists = () => {
        if (item.IsFolder && showArtist) {
            if (item.AlbumArtist && item.Type === ItemKind.MusicAlbum) {
                addTextLine({ title: item.AlbumArtist });
            }
        } else if (showArtist) {
            const artistItems = item.ArtistItems;
            if (artistItems && item.Type !== ItemKind.MusicAlbum) {
                const artists = artistItems.map((a) => a.Name).join(', ');
                addTextLine({ title: artists });
            }
        }
    };

    const addCurrentProgram = () => {
        if (item.Type === ItemKind.TvChannel && item.CurrentProgram && showCurrentProgram) {
            const currentProgram = itemHelper.getDisplayName(item.CurrentProgram, {
                includeParentInfo: includeParentInfoInTitle,
                includeIndexNumber
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
