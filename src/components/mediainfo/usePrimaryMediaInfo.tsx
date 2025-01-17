import * as userSettings from 'scripts/settings/userSettings';
import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';
import itemHelper from '../itemHelper';

import { ItemKind } from 'types/base/models/item-kind';
import { ItemMediaKind } from 'types/base/models/item-media-kind';
import { ItemStatus } from 'types/base/models/item-status';
import type {
    NullableNumber,
    NullableString
} from 'types/base/common/shared/types';
import type { ItemDto } from 'types/base/models/item-dto';
import type { MiscInfo } from 'types/mediaInfoItem';
import { PrimaryInfoOpts } from './type';

function shouldShowFolderRuntime(
    showFolderRuntimeInfo: boolean,
    itemType: ItemKind,
    itemMediaType: ItemMediaKind
): boolean {
    return (
        showFolderRuntimeInfo
        && (itemType === ItemKind.MusicAlbum
            || itemMediaType === ItemMediaKind.MusicArtist
            || itemType === ItemKind.Playlist
            || itemMediaType === ItemMediaKind.Playlist
            || itemMediaType === ItemMediaKind.MusicGenre)
    );
}

function addTrackCountOrItemCount(
    isFolderRuntimeEnabled: boolean,
    showItemCountInfo: boolean,
    itemSongCount: NullableNumber,
    itemChildCount: NullableNumber,
    itemRunTimeTicks: NullableNumber,
    itemType: ItemKind,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (isFolderRuntimeEnabled) {
        const count = itemSongCount || itemChildCount;
        if (count) {
            addMiscInfo({ text: globalize.translate('TrackCount', count) });
        }

        if (itemRunTimeTicks) {
            addMiscInfo({
                text: datetime.getDisplayDuration(itemRunTimeTicks)
            });
        }
    } else if (
        showItemCountInfo
        && (itemType === ItemKind.PhotoAlbum || itemType === ItemKind.BoxSet)
    ) {
        const count = itemChildCount;
        if (count) {
            addMiscInfo({ text: globalize.translate('ItemCount', count) });
        }
    }
}

function addOriginalAirDateInfo(
    showOriginalAirDateInfo: boolean,
    itemType: ItemKind,
    itemMediaType: ItemMediaKind,
    itemPremiereDate: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        showOriginalAirDateInfo
        && (itemType === ItemKind.Episode
            || itemMediaType === ItemMediaKind.Photo)
        && itemPremiereDate
    ) {
        try {
            //don't modify date to locale if episode. Only Dates (not times) are stored, or editable in the edit metadata dialog
            const date = datetime.parseISO8601Date(
                itemPremiereDate,
                itemType !== ItemKind.Episode
            );
            addMiscInfo({ text: datetime.toLocaleDateString(date) });
        } catch {
            console.error('error parsing date:', itemPremiereDate);
        }
    }
}

function addSeriesTimerInfo(
    showSeriesTimerInfo: boolean,
    itemType: ItemKind,
    itemRecordAnyTime: boolean | undefined,
    itemStartDate: NullableString,
    itemRecordAnyChannel: boolean | undefined,
    itemChannelName: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (showSeriesTimerInfo && itemType === ItemKind.SeriesTimer) {
        if (itemRecordAnyTime) {
            addMiscInfo({ text: globalize.translate('Anytime') });
        } else {
            addMiscInfo({ text: datetime.getDisplayTime(itemStartDate) });
        }

        if (itemRecordAnyChannel) {
            addMiscInfo({ text: globalize.translate('AllChannels') });
        } else {
            addMiscInfo({
                text: itemChannelName || globalize.translate('OneChannel')
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
        && userSettings.get('guide-indicator-live') === 'true'
    ) {
        addMiscInfo({
            text: globalize.translate('Live'),
            cssClass: 'mediaInfoProgramAttribute liveTvProgram'
        });
    } else if (
        program?.IsPremiere
        && userSettings.get('guide-indicator-premiere') === 'true'
    ) {
        addMiscInfo({
            text: globalize.translate('Premiere'),
            cssClass: 'mediaInfoProgramAttribute premiereTvProgram'
        });
    } else if (
        program?.IsSeries
        && !program?.IsRepeat
        && userSettings.get('guide-indicator-new') === 'true'
    ) {
        addMiscInfo({
            text: globalize.translate('New'),
            cssClass: 'mediaInfoProgramAttribute newTvProgram'
        });
    } else if (
        program?.IsSeries
        && program?.IsRepeat
        && userSettings.get('guide-indicator-repeat') === 'true'
    ) {
        addMiscInfo({
            text: globalize.translate('Repeat'),
            cssClass: 'mediaInfoProgramAttribute repeatTvProgram'
        });
    }
}

function addProgramIndicators(
    showYearInfo: boolean,
    showEpisodeTitleInfo: boolean,
    showOriginalAirDateInfo: boolean,
    showProgramIndicatorInfo: boolean,
    includeEpisodeTitleIndexNumber: boolean,
    item: ItemDto,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (item.Type === ItemKind.Program || item.Type === ItemKind.Timer) {
        let program = item;
        if (item.Type === ItemKind.Timer && item.ProgramInfo) {
            program = item.ProgramInfo;
        }

        if (showProgramIndicatorInfo) {
            addProgramIndicatorInfo(program, addMiscInfo);
        }

        addProgramTextInfo(
            showEpisodeTitleInfo,
            includeEpisodeTitleIndexNumber,
            showOriginalAirDateInfo,
            showYearInfo,
            program,
            addMiscInfo
        );
    }
}

function addProgramTextInfo(
    showEpisodeTitleInfo: boolean,
    includeEpisodeTitleIndexNumber: boolean,
    showOriginalAirDateInfo: boolean,
    showYearInfo: boolean,
    program: ItemDto,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (showEpisodeTitleInfo && (program.IsSeries || program.EpisodeTitle)) {
        const text = itemHelper.getDisplayName(program, {
            includeIndexNumber: includeEpisodeTitleIndexNumber
        });

        if (text) {
            addMiscInfo({ text: text });
        }
    } else if (
        ((showOriginalAirDateInfo && program.IsMovie) || showYearInfo)
        && program.ProductionYear
    ) {
        addMiscInfo({ text: program.ProductionYear });
    } else if (showOriginalAirDateInfo && program.PremiereDate) {
        try {
            const date = datetime.parseISO8601Date(program.PremiereDate);
            const text = globalize.translate(
                'OriginalAirDateValue',
                datetime.toLocaleDateString(date)
            );
            addMiscInfo({ text: text });
        } catch {
            console.error('error parsing date:', program.PremiereDate);
        }
    }
}

function addStartDateInfo(
    showStartDateInfo: boolean,
    itemStartDate: NullableString,
    itemType: ItemKind,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        showStartDateInfo
        && itemStartDate
        && itemType !== ItemKind.Program
        && itemType !== ItemKind.SeriesTimer
        && itemType !== ItemKind.Timer
    ) {
        try {
            const date = datetime.parseISO8601Date(itemStartDate);
            addMiscInfo({ text: datetime.toLocaleDateString(date) });

            if (itemType !== ItemKind.Recording) {
                addMiscInfo({ text: datetime.getDisplayTime(date) });
            }
        } catch {
            console.error('error parsing date:', itemStartDate);
        }
    }
}

function addSeriesProductionYearInfo(
    showYearInfo: boolean,
    itemProductionYear: NullableNumber,
    itemType: ItemKind,
    itemStatus: ItemStatus,
    itemEndDate: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (showYearInfo && itemProductionYear && itemType === ItemKind.Series) {
        if (itemStatus === ItemStatus.Continuing) {
            addMiscInfo({
                text: globalize.translate(
                    'SeriesYearToPresent',
                    datetime.toLocaleString(itemProductionYear, {
                        useGrouping: false
                    })
                )
            });
        } else {
            addproductionYearWithEndDate(
                itemProductionYear,
                itemEndDate,
                addMiscInfo
            );
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
        } catch {
            console.error('error parsing date:', itemEndDate);
        }
    }
    addMiscInfo({ text: productionYear });
}

function addYearInfo(
    showYearInfo: boolean,
    itemType: ItemKind,
    itemMediaType: ItemMediaKind,
    itemProductionYear: NullableNumber,
    itemPremiereDate: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        showYearInfo
        && itemType !== ItemKind.Series
        && itemType !== ItemKind.Episode
        && itemType !== ItemKind.Person
        && itemMediaType !== ItemMediaKind.Photo
        && itemType !== ItemKind.Program
        && itemType !== ItemKind.Season
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
            } catch {
                console.error('error parsing date:', itemPremiereDate);
            }
        }
    }
}

function addVideo3DFormat(
    showVideo3DFormatInfo: boolean,
    itemVideo3DFormat: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (showVideo3DFormatInfo && itemVideo3DFormat) {
        addMiscInfo({ text: '3D' });
    }
}

function addRunTimeInfo(
    isFolderRuntimeEnabled: boolean,
    showRuntimeInfo: boolean,
    itemRunTimeTicks: NullableNumber,
    itemType: ItemKind,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        !isFolderRuntimeEnabled
        && showRuntimeInfo
        && itemRunTimeTicks
        && itemType !== ItemKind.Series
        && itemType !== ItemKind.Program
        && itemType !== ItemKind.Timer
        && itemType !== ItemKind.Book
    ) {
        if (itemType === ItemKind.Audio) {
            addMiscInfo({
                text: datetime.getDisplayRunningTime(itemRunTimeTicks)
            });
        } else {
            addMiscInfo({
                text: datetime.getDisplayDuration(itemRunTimeTicks)
            });
        }
    }
}

function addOfficialRatingInfo(
    showOfficialRatingInfo: boolean,
    itemOfficialRating: NullableString,
    itemType: ItemKind,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        showOfficialRatingInfo
        && itemOfficialRating
        && itemType !== ItemKind.Season
        && itemType !== ItemKind.Episode
    ) {
        addMiscInfo({
            text: itemOfficialRating,
            cssClass: 'mediaInfoText mediaInfoOfficialRating'
        });
    }
}

function addAudioContainer(
    showAudioContainerInfo: boolean,
    itemContainer: NullableString,
    itemType: ItemKind,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        showAudioContainerInfo
        && itemContainer
        && itemType === ItemKind.Audio
    ) {
        addMiscInfo({ text: itemContainer });
    }
}

function addPhotoSize(
    showPhotoSizeInfo: boolean,
    itemMediaType: ItemMediaKind,
    itemWidth: NullableNumber,
    itemHeight: NullableNumber,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        showPhotoSizeInfo
        && itemMediaType === ItemMediaKind.Photo
        && itemWidth
        && itemHeight
    ) {
        const size = `${itemWidth}x${itemHeight}`;

        addMiscInfo({ text: size });
    }
}

interface UsePrimaryMediaInfoProps extends PrimaryInfoOpts {
    item: ItemDto;
}

function usePrimaryMediaInfo({
    item,
    showYearInfo = false,
    showAudioContainerInfo = false,
    showEpisodeTitleInfo = false,
    showOriginalAirDateInfo = false,
    showFolderRuntimeInfo = false,
    showRuntimeInfo = false,
    showItemCountInfo = false,
    showSeriesTimerInfo = false,
    showStartDateInfo = false,
    showProgramIndicatorInfo = false,
    includeEpisodeTitleIndexNumber = false,
    showOfficialRatingInfo = false,
    showVideo3DFormatInfo = false,
    showPhotoSizeInfo = false
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

    const isFolderRuntimeEnabled = shouldShowFolderRuntime(
        showFolderRuntimeInfo,
        Type,
        MediaType
    );

    addTrackCountOrItemCount(
        isFolderRuntimeEnabled,
        showItemCountInfo,
        SongCount,
        ChildCount,
        RunTimeTicks,
        Type,
        addMiscInfo
    );

    addOriginalAirDateInfo(
        showOriginalAirDateInfo,
        Type,
        MediaType,
        PremiereDate,
        addMiscInfo
    );

    addSeriesTimerInfo(
        showSeriesTimerInfo,
        Type,
        RecordAnyTime,
        StartDate,
        RecordAnyChannel,
        ChannelName,
        addMiscInfo
    );

    addStartDateInfo(showStartDateInfo, StartDate, Type, addMiscInfo);

    addSeriesProductionYearInfo(
        showYearInfo,
        ProductionYear,
        Type,
        Status,
        EndDate,
        addMiscInfo
    );

    addProgramIndicators(
        showProgramIndicatorInfo,
        showEpisodeTitleInfo,
        includeEpisodeTitleIndexNumber,
        showOriginalAirDateInfo,
        showYearInfo,
        item,
        addMiscInfo
    );

    addYearInfo(
        showYearInfo,
        Type,
        MediaType,
        ProductionYear,
        PremiereDate,
        addMiscInfo
    );

    addRunTimeInfo(
        isFolderRuntimeEnabled,
        showRuntimeInfo,
        RunTimeTicks,
        Type,
        addMiscInfo
    );

    addOfficialRatingInfo(
        showOfficialRatingInfo,
        OfficialRating,
        Type,
        addMiscInfo
    );

    addVideo3DFormat(showVideo3DFormatInfo, Video3DFormat, addMiscInfo);

    addPhotoSize(showPhotoSizeInfo, MediaType, Width, Height, addMiscInfo);

    addAudioContainer(showAudioContainerInfo, Container, Type, addMiscInfo);

    return miscInfo;
}

export default usePrimaryMediaInfo;
