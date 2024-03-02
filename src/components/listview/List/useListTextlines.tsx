import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React from 'react';
import itemHelper from '../../itemHelper';
import datetime from 'scripts/datetime';
import ListTextWrapper from './ListTextWrapper';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';

function getParentTitle(
    showParentTitle: boolean | undefined,
    item: ItemDto,
    parentTitleWithTitle: boolean | undefined,
    displayName: string | null | undefined
) {
    let parentTitle = null;
    if (showParentTitle) {
        if (item.Type === BaseItemKind.Episode) {
            parentTitle = item.SeriesName;
        } else if (item.IsSeries || (item.EpisodeTitle && item.Name)) {
            parentTitle = item.Name;
        }
    }
    if (showParentTitle && parentTitleWithTitle) {
        if (displayName) {
            parentTitle += ' - ';
        }
        parentTitle = (parentTitle ?? '') + displayName;
    }
    return parentTitle;
}

function getNameOrIndexWithName(
    item: ItemDto,
    listOptions: ListOptions,
    showIndexNumber: boolean | undefined
) {
    let displayName = itemHelper.getDisplayName(item, {
        includeParentInfo: listOptions.includeParentInfoInTitle
    });

    if (showIndexNumber && item.IndexNumber != null) {
        displayName = `${item.IndexNumber}. ${displayName}`;
    }
    return displayName;
}

interface UseListTextlinesProps {
    item: ItemDto;
    listOptions?: ListOptions;
    isLargeStyle?: boolean;
}

function useListTextlines({ item = {}, listOptions = {}, isLargeStyle }: UseListTextlinesProps) {
    const {
        showProgramDateTime,
        showProgramTime,
        showChannel,
        showParentTitle,
        showIndexNumber,
        parentTitleWithTitle,
        artist
    } = listOptions;
    const textLines: string[] = [];

    const addTextLine = (text: string | null) => {
        if (text) {
            textLines.push(text);
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
            addTextLine(programDateTime);
        }
    };

    const addProgramTime = () => {
        if (showProgramTime) {
            const programTime = datetime.getDisplayTime(
                datetime.parseISO8601Date(item.StartDate)
            );
            addTextLine(programTime);
        }
    };

    const addChannelName = () => {
        if (showChannel && item.ChannelName) {
            addTextLine(item.ChannelName);
        }
    };

    const displayName = getNameOrIndexWithName(item, listOptions, showIndexNumber);

    const parentTitle = getParentTitle(showParentTitle, item, parentTitleWithTitle, displayName );

    const addParentTitle = () => {
        addTextLine(parentTitle ?? '');
    };

    const addDisplayName = () => {
        if (displayName && !parentTitleWithTitle) {
            addTextLine(displayName);
        }
    };

    const addAlbumArtistOrArtists = () => {
        if (item.IsFolder && artist !== false) {
            if (item.AlbumArtist && item.Type === BaseItemKind.MusicAlbum) {
                addTextLine(item.AlbumArtist);
            }
        } else if (artist) {
            const artistItems = item.ArtistItems;
            if (artistItems && item.Type !== BaseItemKind.MusicAlbum) {
                const artists = artistItems.map((a) => a.Name).join(', ');
                addTextLine(artists);
            }
        }
    };

    const addCurrentProgram = () => {
        if (item.Type === BaseItemKind.TvChannel && item.CurrentProgram) {
            const currentProgram = itemHelper.getDisplayName(
                item.CurrentProgram
            );
            addTextLine(currentProgram);
        }
    };

    addProgramDateTime();
    addProgramTime();
    addChannelName();
    addParentTitle();
    addDisplayName();
    addAlbumArtistOrArtists();
    addCurrentProgram();

    const renderTextlines = (text: string, index: number) => {
        return (
            <ListTextWrapper
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                index={index}
                isLargeStyle={isLargeStyle}
            >
                <bdi>{text}</bdi>
            </ListTextWrapper>
        );
    };

    const listTextLines = textLines?.map((text, index) => renderTextlines(text, index));

    return {
        listTextLines
    };
}

export default useListTextlines;
