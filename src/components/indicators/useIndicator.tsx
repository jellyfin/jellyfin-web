import { LocationType } from '@jellyfin/sdk/lib/generated-client/models/location-type';
import React from 'react';
import { Box } from 'ui-primitives';
import { Progress } from 'ui-primitives';
import { CheckIcon, DotFilledIcon, DotIcon, FileIcon, ImageIcon, VideoIcon, ViewGridIcon } from '@radix-ui/react-icons';
import classNames from 'classnames';
import * as styles from './useIndicator.css.ts';

import datetime from 'scripts/datetime';
import itemHelper from 'components/itemHelper';
import AutoTimeProgressBar from '../playback/AutoTimeProgressBar';

import { ItemKind } from 'types/base/models/item-kind';
import { ItemMediaKind } from 'types/base/models/item-media-kind';
import { ItemStatus } from 'types/base/models/item-status';

import type { NullableString } from 'types/base/common/shared/types';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ProgressOptions } from 'types/progressOptions';

const TypeIcon = {
    Video: <VideoIcon className="indicatorIcon" />,
    Folder: <FileIcon className="indicatorIcon" />,
    PhotoAlbum: <ViewGridIcon className="indicatorIcon" />,
    Photo: <ImageIcon className="indicatorIcon" />
};

const getTypeIcon = (itemType: NullableString) => {
    return TypeIcon[itemType as keyof typeof TypeIcon];
};

const enableProgressIndicator = (itemType: ItemKind, itemMediaType: ItemMediaKind) => {
    return (
        (itemMediaType === ItemMediaKind.Video && itemType !== ItemKind.TvChannel) ||
        itemType === ItemKind.AudioBook ||
        itemType === ItemKind.AudioPodcast
    );
};

const enableAutoTimeProgressIndicator = (
    itemType: ItemKind,
    itemStartDate: NullableString,
    itemEndDate: NullableString
) => {
    return (
        (itemType === ItemKind.Program || itemType === ItemKind.Timer || itemType === ItemKind.Recording) &&
        Boolean(itemStartDate) &&
        Boolean(itemEndDate)
    );
};

const enablePlayedIndicator = (item: ItemDto) => {
    return itemHelper.canMarkPlayed(item as any);
};

const formatCountIndicator = (count: number) => {
    return count >= 100 ? '99+' : count.toString();
};

const useIndicator = (item: ItemDto) => {
    const getMediaSourceIndicator = () => {
        const mediaSourceCount = item.MediaSourceCount ?? 0;
        if (mediaSourceCount > 1) {
            return <Box className="mediaSourceIndicator">{mediaSourceCount}</Box>;
        }

        return null;
    };

    const getMissingIndicator = () => {
        if (item.Type === ItemKind.Episode && item.LocationType === LocationType.Virtual) {
            if (item.PremiereDate) {
                try {
                    const premiereDate = datetime.parseISO8601Date(item.PremiereDate).getTime();
                    if (premiereDate > new Date().getTime()) {
                        return <Box className="unairedIndicator">Unaired</Box>;
                    }
                } catch (err) {
                    console.error(err);
                }
            }
            return <Box className="missingIndicator">Missing</Box>;
        }

        return null;
    };

    const getTimerIndicator = (className?: string) => {
        const indicatorIconClass = classNames('timerIndicator', className);

        let status: ItemStatus | undefined;

        if (item.Type === ItemKind.SeriesTimer) {
            return <DotFilledIcon className={indicatorIconClass} />;
        } else if (item.TimerId || item.SeriesTimerId) {
            status = item.Status || ItemStatus.Cancelled;
        } else if (item.Type === ItemKind.Timer) {
            status = item.Status;
        } else {
            return null;
        }

        if (item.SeriesTimerId) {
            return (
                <DotFilledIcon
                    className={`${indicatorIconClass} ${
                        status === ItemStatus.Cancelled ? 'timerIndicator-inactive' : ''
                    }`}
                />
            );
        }

        return <DotIcon className={indicatorIconClass} />;
    };

    const getTypeIndicator = () => {
        const icon = getTypeIcon(item.Type);
        if (icon) {
            return <Box className="indicator videoIndicator">{icon}</Box>;
        }
        return null;
    };

    const getChildCountIndicator = () => {
        const childCount = item.ChildCount ?? 0;

        if (childCount > 1) {
            return (
                <Box className="countIndicator indicator childCountIndicator">{formatCountIndicator(childCount)}</Box>
            );
        }

        return null;
    };

    const getPlayedIndicator = () => {
        if (enablePlayedIndicator(item)) {
            const userData = item.UserData || {};
            if (userData.UnplayedItemCount) {
                return (
                    <Box className="countIndicator indicator unplayedItemCount">
                        {formatCountIndicator(userData.UnplayedItemCount)}
                    </Box>
                );
            }

            if ((userData.PlayedPercentage && userData.PlayedPercentage >= 100) || userData.Played) {
                return (
                    <Box className="playedIndicator indicator">
                        <CheckIcon className="indicatorIcon" />
                    </Box>
                );
            }
        }

        return null;
    };

    const getProgress = (pct: number, progressOptions?: ProgressOptions) => {
        const progressBarClass = classNames('itemLinearProgress', progressOptions?.containerClass, styles.progressBar);

        return <Progress className={progressBarClass} value={pct} />;
    };

    const getProgressBar = (progressOptions?: ProgressOptions) => {
        if (enableProgressIndicator(item.Type, item.MediaType) && item.Type !== ItemKind.Recording) {
            const playedPercentage = progressOptions?.userData?.PlayedPercentage
                ? progressOptions.userData.PlayedPercentage
                : item?.UserData?.PlayedPercentage;
            if (playedPercentage && playedPercentage < 100) {
                return getProgress(playedPercentage);
            }
        }

        if (enableAutoTimeProgressIndicator(item.Type, item.StartDate, item.EndDate)) {
            let startDate = 0;
            let endDate = 1;

            try {
                startDate = datetime.parseISO8601Date(item.StartDate || '').getTime();
                endDate = datetime.parseISO8601Date(item.EndDate || '').getTime();
            } catch (err) {
                console.error(err);
            }

            const now = new Date().getTime();
            const total = endDate - startDate;
            const pct = 100 * ((now - startDate) / total);

            if (pct > 0 && pct < 100) {
                const isRecording =
                    item.Type === ItemKind.Timer || item.Type === ItemKind.Recording || Boolean(item.TimerId);
                return (
                    <AutoTimeProgressBar
                        pct={pct}
                        progressOptions={progressOptions}
                        isRecording={isRecording}
                        starTtime={startDate}
                        endTtime={endDate}
                        dataAutoMode="time"
                    />
                );
            }
        }

        return null;
    };

    return {
        getProgress,
        getProgressBar,
        getMediaSourceIndicator,
        getMissingIndicator,
        getTimerIndicator,
        getTypeIndicator,
        getChildCountIndicator,
        getPlayedIndicator
    };
};

export default useIndicator;
