import React, { type FC } from 'react';
import classNames from 'classnames';
import { Box } from 'ui-primitives/Box';
import usePrimaryMediaInfo from './usePrimaryMediaInfo';

import MediaInfoItem from './MediaInfoItem';
import StarIcons from './StarIcons';
import CaptionMediaInfo from './CaptionMediaInfo';
import CriticRatingMediaInfo from './CriticRatingMediaInfo';
import EndsAt from './EndsAt';

import { ItemMediaKind } from 'types/base/models/item-media-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import type { MiscInfo } from 'types/mediaInfoItem';
import type { PrimaryInfoOpts } from './type';

interface PrimaryMediaInfoProps extends PrimaryInfoOpts {
    className?: string;
    infoclass?: string;
    item: ItemDto;
    showStarRatingInfo?: boolean;
    showCaptionIndicatorInfo?: boolean;
    showCriticRatingInfo?: boolean;
    showEndsAtInfo?: boolean;
    getMissingIndicator?: () => React.JSX.Element | null;
}

const PrimaryMediaInfo: FC<PrimaryMediaInfoProps> = ({
    className,
    infoclass,
    item,
    showYearInfo,
    showAudioContainerInfo,
    showEpisodeTitleInfo,
    showOriginalAirDateInfo,
    showFolderRuntimeInfo,
    showRuntimeInfo,
    showItemCountInfo,
    showSeriesTimerInfo,
    showStartDateInfo,
    showProgramIndicatorInfo,
    includeEpisodeTitleIndexNumber,
    showOfficialRatingInfo,
    showVideo3DFormatInfo,
    showPhotoSizeInfo,
    showStarRatingInfo = false,
    showCaptionIndicatorInfo = false,
    showCriticRatingInfo = false,
    showEndsAtInfo = false,
    getMissingIndicator
}) => {
    const miscInfo = usePrimaryMediaInfo({
        item,
        showYearInfo,
        showAudioContainerInfo,
        showEpisodeTitleInfo,
        showOriginalAirDateInfo,
        showFolderRuntimeInfo,
        showRuntimeInfo,
        showItemCountInfo,
        showSeriesTimerInfo,
        showStartDateInfo,
        showProgramIndicatorInfo,
        includeEpisodeTitleIndexNumber,
        showOfficialRatingInfo,
        showVideo3DFormatInfo,
        showPhotoSizeInfo
    });
    const { StartDate, HasSubtitles, MediaType, RunTimeTicks, PlaybackPositionTicks, CommunityRating, CriticRating } =
        item;

    const cssClass = classNames(className);

    // Create stable key from content
    const getInfoKey = (info: MiscInfo, index: number): string => {
        const type = info.type ?? 'info';
        const text = String(info.text ?? '');
        return `${type}-${text}-${index}`;
    };

    return (
        <Box className={cssClass}>
            {miscInfo.map((info, index) => (
                <MediaInfoItem key={getInfoKey(info, index)} className={infoclass} miscInfo={info} />
            ))}

            {showStarRatingInfo && CommunityRating && (
                <StarIcons className={infoclass} communityRating={CommunityRating} />
            )}

            {showCaptionIndicatorInfo && HasSubtitles && <CaptionMediaInfo className={infoclass} />}

            {showCriticRatingInfo && CriticRating && (
                <CriticRatingMediaInfo className={infoclass} criticRating={CriticRating} />
            )}

            {showEndsAtInfo && MediaType === ItemMediaKind.Video && RunTimeTicks && !StartDate && (
                <EndsAt className={infoclass} runTimeTicks={RunTimeTicks} positionTicks={PlaybackPositionTicks} />
            )}

            {getMissingIndicator?.()}
        </Box>
    );
};

export default PrimaryMediaInfo;
