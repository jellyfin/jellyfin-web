import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import * as userSettings from 'scripts/settings/userSettings';
import datetime from 'scripts/datetime';
import globalize from 'scripts/globalize';
import itemHelper from '../itemHelper';
import type { NullableNumber, NullableString } from 'types/base/common/shared/types';
import type { ItemDto } from 'types/base/models/item-dto';
import type { MiscInfo } from 'types/mediaInfoItem';

function shouldShowFolderRuntime(
    itemType: NullableString,
    itemMediaType: NullableString
): boolean {
    return (
        itemType === BaseItemKind.MusicAlbum
        || itemMediaType === 'MusicArtist'
        || itemType === BaseItemKind.Playlist
        || itemMediaType === 'Playlist'
        || itemMediaType === 'MusicGenre'
    );
}

function addTrackCountOrItemCount(
    showFolderRuntime: boolean,
    itemSongCount: NullableNumber,
    itemChildCount: NullableNumber,
    itemRunTimeTicks: NullableNumber,
    itemType: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (showFolderRuntime) {
        const count = itemSongCount ?? itemChildCount;
        if (count) {
            addMiscInfo({ text: globalize.translate('TrackCount', count) });
        }

        if (itemRunTimeTicks) {
            addMiscInfo({ text: datetime.getDisplayDuration(itemRunTimeTicks) });
        }
    } else if (itemType === BaseItemKind.PhotoAlbum || itemType === BaseItemKind.BoxSet) {
        const count = itemChildCount;
        if (count) {
            addMiscInfo({ text: globalize.translate('ItemCount', count) });
        }
    }
}

function addOriginalAirDateInfo(
    itemType: NullableString,
    itemMediaType: NullableString,
    isOriginalAirDateEnabled: boolean,
    itemPremiereDate: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        itemPremiereDate
        && (itemType === BaseItemKind.Episode || itemMediaType === 'Photo')
        && isOriginalAirDateEnabled
    ) {
        try {
            //don't modify date to locale if episode. Only Dates (not times) are stored, or editable in the edit metadata dialog
            const date = datetime.parseISO8601Date(
                itemPremiereDate,
                itemType !== BaseItemKind.Episode
            );
            addMiscInfo({ text: datetime.toLocaleDateString(date) });
        } catch (e) {
            console.error('error parsing date:', itemPremiereDate);
        }
    }
}

function addSeriesTimerInfo(
    itemType: NullableString,
    itemRecordAnyTime: boolean | undefined,
    itemStartDate: NullableString,
    itemRecordAnyChannel: boolean | undefined,
    itemChannelName: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (itemType === 'SeriesTimer') {
        if (itemRecordAnyTime) {
            addMiscInfo({ text: globalize.translate('Anytime') });
        } else {
            addMiscInfo({ text: datetime.getDisplayTime(itemStartDate) });
        }

        if (itemRecordAnyChannel) {
            addMiscInfo({ text: globalize.translate('AllChannels') });
        } else {
            addMiscInfo({
                text: itemChannelName ?? globalize.translate('OneChannel')
            });
        }
    }
}

function addProgramIndicatorInfo(
    program: ItemDto | undefined,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        program?.IsLive
        && userSettings.get('guide-indicator-live', false) === 'true'
    ) {
        addMiscInfo({
            text: globalize.translate('Live'),
            cssClass: 'mediaInfoProgramAttribute liveTvProgram'
        });
    } else if (
        program?.IsPremiere
        && userSettings.get('guide-indicator-premiere', false) === 'true'
    ) {
        addMiscInfo({
            text: globalize.translate('Premiere'),
            cssClass: 'mediaInfoProgramAttribute premiereTvProgram'
        });
    } else if (
        program?.IsSeries
        && !program?.IsRepeat
        && userSettings.get('guide-indicator-new', false) === 'true'
    ) {
        addMiscInfo({
            text: globalize.translate('New'),
            cssClass: 'mediaInfoProgramAttribute newTvProgram'
        });
    } else if (
        program?.IsSeries
        && program?.IsRepeat
        && userSettings.get('guide-indicator-repeat', false) === 'true'
    ) {
        addMiscInfo({
            text: globalize.translate('Repeat'),
            cssClass: 'mediaInfoProgramAttribute repeatTvProgram'
        });
    }
}

function addProgramIndicators(
    item: ItemDto,
    isYearEnabled: boolean,
    isEpisodeTitleEnabled: boolean,
    isOriginalAirDateEnabled: boolean,
    isProgramIndicatorEnabled: boolean,
    isEpisodeTitleIndexNumberEnabled: boolean,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (item.Type === BaseItemKind.Program || item.Type === 'Timer') {
        let program = item;
        if (item.Type === 'Timer' && item.ProgramInfo) {
            program = item.ProgramInfo;
        }

        if (isProgramIndicatorEnabled !== false) {
            addProgramIndicatorInfo(program, addMiscInfo);
        }

        addProgramTextInfo(
            program,
            isEpisodeTitleEnabled,
            isEpisodeTitleIndexNumberEnabled,
            isOriginalAirDateEnabled,
            isYearEnabled,
            addMiscInfo
        );
    }
}

function addProgramTextInfo(
    program: ItemDto,
    isEpisodeTitleEnabled: boolean,
    isEpisodeTitleIndexNumberEnabled: boolean,
    isOriginalAirDateEnabled: boolean,
    isYearEnabled: boolean,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if ((program?.IsSeries || program?.EpisodeTitle)
    && isEpisodeTitleEnabled !== false) {
        const text = itemHelper.getDisplayName(program, {
            includeIndexNumber: isEpisodeTitleIndexNumberEnabled
        });

        if (text) {
            addMiscInfo({ text: text });
        }
    } else if (
        program?.ProductionYear
        && ((program?.IsMovie && isOriginalAirDateEnabled !== false)
            || isYearEnabled !== false)
    ) {
        addMiscInfo({ text: program.ProductionYear });
    } else if (program?.PremiereDate && isOriginalAirDateEnabled !== false) {
        try {
            const date = datetime.parseISO8601Date(program.PremiereDate);
            const text = globalize.translate(
                'OriginalAirDateValue',
                datetime.toLocaleDateString(date)
            );
            addMiscInfo({ text: text });
        } catch (e) {
            console.error('error parsing date:', program.PremiereDate);
        }
    }
}

function addStartDateInfo(
    itemStartDate: NullableString,
    itemType: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        itemStartDate
        && itemType !== BaseItemKind.Program
        && itemType !== 'SeriesTimer'
        && itemType !== 'Timer'
    ) {
        try {
            const date = datetime.parseISO8601Date(itemStartDate);
            addMiscInfo({ text: datetime.toLocaleDateString(date) });

            if (itemType !== BaseItemKind.Recording) {
                addMiscInfo({ text: datetime.getDisplayTime(date) });
            }
        } catch (e) {
            console.error('error parsing date:', itemStartDate);
        }
    }
}

function addSeriesProductionYearInfo(
    itemProductionYear: NullableNumber,
    itemType: NullableString,
    isYearEnabled: boolean,
    itemStatus: NullableString,
    itemEndDate: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (itemProductionYear && isYearEnabled && itemType === BaseItemKind.Series) {
        if (itemStatus === 'Continuing') {
            addMiscInfo({
                text: globalize.translate(
                    'SeriesYearToPresent',
                    datetime.toLocaleString(itemProductionYear, {
                        useGrouping: false
                    })
                )
            });
        } else {
            addproductionYearWithEndDate(itemProductionYear, itemEndDate, addMiscInfo);
        }
    }
}

function addproductionYearWithEndDate(
    itemProductionYear: number,
    itemEndDate: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    let productionYear = datetime.toLocaleString(itemProductionYear, {
        useGrouping: false
    });

    if (itemEndDate) {
        try {
            const endYear = datetime.toLocaleString(
                datetime.parseISO8601Date(itemEndDate).getFullYear(),
                { useGrouping: false }
            );
            /* At this point, text will contain only the start year */
            if (endYear !== itemProductionYear) {
                productionYear += `-${endYear}`;
            }
        } catch (e) {
            console.error('error parsing date:', itemEndDate);
        }
    }
    addMiscInfo({ text: productionYear });
}

function addYearInfo(
    isYearEnabled: boolean,
    itemType: NullableString,
    itemMediaType: NullableString,
    itemProductionYear: NullableNumber,
    itemPremiereDate: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        isYearEnabled
        && itemType !== BaseItemKind.Series
        && itemType !== BaseItemKind.Episode
        && itemType !== BaseItemKind.Person
        && itemMediaType !== 'Photo'
        && itemType !== BaseItemKind.Program
        && itemType !== BaseItemKind.Season
    ) {
        if (itemProductionYear) {
            addMiscInfo({ text: itemProductionYear });
        } else if (itemPremiereDate) {
            try {
                const text = datetime.toLocaleString(
                    datetime.parseISO8601Date(itemPremiereDate).getFullYear(),
                    { useGrouping: false }
                );
                addMiscInfo({ text: text });
            } catch (e) {
                console.error('error parsing date:', itemPremiereDate);
            }
        }
    }
}

function addVideo3DFormat(
    itemVideo3DFormat: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (itemVideo3DFormat) {
        addMiscInfo({ text: '3D' });
    }
}

function addRunTimeInfo(
    itemRunTimeTicks: NullableNumber,
    itemType: NullableString,
    showFolderRuntime: boolean,
    isRuntimeEnabled: boolean,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        itemRunTimeTicks
        && itemType !== BaseItemKind.Series
        && itemType !== BaseItemKind.Program
        && itemType !== 'Timer'
        && itemType !== BaseItemKind.Book
        && !showFolderRuntime
        && isRuntimeEnabled
    ) {
        if (itemType === BaseItemKind.Audio) {
            addMiscInfo({ text: datetime.getDisplayRunningTime(itemRunTimeTicks) });
        } else {
            addMiscInfo({ text: datetime.getDisplayDuration(itemRunTimeTicks) });
        }
    }
}

function addOfficialRatingInfo(
    itemOfficialRating: NullableString,
    itemType: NullableString,
    isOfficialRatingEnabled: boolean,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        itemOfficialRating
        && isOfficialRatingEnabled
        && itemType !== BaseItemKind.Season
        && itemType !== BaseItemKind.Episode
    ) {
        addMiscInfo({
            text: itemOfficialRating,
            cssClass: 'mediaInfoOfficialRating'
        });
    }
}

function addAudioContainer(
    itemContainer: NullableString,
    isContainerEnabled: boolean,
    itemType: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (itemContainer && isContainerEnabled && itemType === BaseItemKind.Audio) {
        addMiscInfo({ text: itemContainer });
    }
}

function addPhotoSize(
    itemMediaType: NullableString,
    itemWidth: NullableNumber,
    itemHeight: NullableNumber,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (itemMediaType === 'Photo' && itemWidth && itemHeight) {
        const size = `${itemWidth}x${itemHeight}`;

        addMiscInfo({ text: size });
    }
}

interface UsePrimaryMediaInfoProps {
    item: ItemDto;
    isYearEnabled: boolean;
    isContainerEnabled: boolean;
    isEpisodeTitleEnabled: boolean;
    isOriginalAirDateEnabled: boolean;
    isRuntimeEnabled: boolean;
    isProgramIndicatorEnabled: boolean;
    isEpisodeTitleIndexNumberEnabled: boolean;
    isOfficialRatingEnabled: boolean;
}

function usePrimaryMediaInfo({
    item,
    isYearEnabled = false,
    isContainerEnabled = false,
    isEpisodeTitleEnabled = false,
    isOriginalAirDateEnabled = false,
    isRuntimeEnabled = false,
    isProgramIndicatorEnabled = false,
    isEpisodeTitleIndexNumberEnabled = false,
    isOfficialRatingEnabled = false
}: UsePrimaryMediaInfoProps) {
    const {
        EndDate,
        Status,
        StartDate,
        ProductionYear,
        Video3DFormat,
        Type,
        Width,
        Height,
        MediaType,
        SongCount,
        RecordAnyTime,
        RecordAnyChannel,
        ChannelName,
        ChildCount,
        RunTimeTicks,
        PremiereDate,
        OfficialRating,
        Container
    } = item;

    const miscInfo: MiscInfo[] = [];

    const addMiscInfo = (val: MiscInfo) => {
        if (val) {
            miscInfo.push(val);
        }
    };

    const showFolderRuntime = shouldShowFolderRuntime(Type, MediaType);

    addTrackCountOrItemCount(
        showFolderRuntime,
        SongCount,
        ChildCount,
        RunTimeTicks,
        Type,
        addMiscInfo
    );

    addOriginalAirDateInfo(
        Type,
        MediaType,
        isOriginalAirDateEnabled,
        PremiereDate,
        addMiscInfo
    );

    addSeriesTimerInfo(
        Type,
        RecordAnyTime,
        StartDate,
        RecordAnyChannel,
        ChannelName,
        addMiscInfo
    );

    addStartDateInfo(StartDate, Type, addMiscInfo);

    addSeriesProductionYearInfo(
        ProductionYear,
        Type,
        isYearEnabled,
        Status,
        EndDate,
        addMiscInfo
    );

    addProgramIndicators(
        item,
        isProgramIndicatorEnabled,
        isEpisodeTitleEnabled,
        isEpisodeTitleIndexNumberEnabled,
        isOriginalAirDateEnabled,
        isYearEnabled,
        addMiscInfo
    );

    addYearInfo(
        isYearEnabled,
        Type,
        MediaType,
        ProductionYear,
        PremiereDate,
        addMiscInfo
    );

    addRunTimeInfo(
        RunTimeTicks,
        Type,
        showFolderRuntime,
        isRuntimeEnabled,
        addMiscInfo
    );

    addOfficialRatingInfo(
        OfficialRating,
        Type,
        isOfficialRatingEnabled,
        addMiscInfo
    );

    addVideo3DFormat(Video3DFormat, addMiscInfo);

    addPhotoSize(MediaType, Width, Height, addMiscInfo);

    addAudioContainer(Container, isContainerEnabled, Type, addMiscInfo);

    return miscInfo;
}

export default usePrimaryMediaInfo;
