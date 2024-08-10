import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
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
    item: ItemDto;
    showStarRatingInfo?: boolean;
    showCaptionIndicatorInfo?: boolean;
    showCriticRatingInfo?: boolean;
    showEndsAtInfo?: boolean;
    showMissingIndicatorInfo?: boolean;
    getMissingIndicator?: () => React.JSX.Element | null
}

const PrimaryMediaInfo: FC<PrimaryMediaInfoProps> = ({
    className,
    item,
    showYearInfo,
    showAudioContainerInfo,
    showEpisodeTitleInfo,
    showOriginalAirDateInfo,
    showRuntimeInfo,
    showProgramIndicatorInfo,
    includeEpisodeTitleIndexNumber,
    showOfficialRatingInfo,
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
        showRuntimeInfo,
        showProgramIndicatorInfo,
        includeEpisodeTitleIndexNumber,
        showOfficialRatingInfo
    });
    const {
        StartDate,
        HasSubtitles,
        MediaType,
        RunTimeTicks,
        CommunityRating,
        CriticRating
    } = item;

    const cssClass = classNames(className);

    const renderMediaInfo = (info: MiscInfo | undefined, index: number) => (
        <MediaInfoItem key={index} miscInfo={info} />
    );

    return (
        <Box className={cssClass}>
            {miscInfo.map((info, index) => renderMediaInfo(info, index))}

            {showStarRatingInfo && CommunityRating && (
                <StarIcons communityRating={CommunityRating} />
            )}

            {showCaptionIndicatorInfo && HasSubtitles && <CaptionMediaInfo />}

            {showCriticRatingInfo && CriticRating && (
                <CriticRatingMediaInfo criticRating={CriticRating} />
            )}

            {showEndsAtInfo
                && MediaType === ItemMediaKind.Video
                && RunTimeTicks
                && !StartDate && <EndsAt runTimeTicks={RunTimeTicks} />}

            {getMissingIndicator?.()}
        </Box>
    );
};

export default PrimaryMediaInfo;
