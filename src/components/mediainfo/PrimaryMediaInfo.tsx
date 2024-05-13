import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import usePrimaryMediaInfo from './usePrimaryMediaInfo';

import MediaInfoItem from './MediaInfoItem';
import StarIcons from './StarIcons';
import CaptionMediaInfo from './CaptionMediaInfo';
import CriticRatingMediaInfo from './CriticRatingMediaInfo';
import EndsAt from './EndsAt';
import type { ItemDto } from 'types/base/models/item-dto';
import type { MiscInfo } from 'types/mediaInfoItem';

interface PrimaryMediaInfoProps {
    className?: string;
    item: ItemDto;
    isYearEnabled?: boolean;
    isContainerEnabled?: boolean;
    isEpisodeTitleEnabled?: boolean;
    isCriticRatingEnabled?: boolean;
    isEndsAtEnabled?: boolean;
    isOriginalAirDateEnabled?: boolean;
    isRuntimeEnabled?: boolean;
    isProgramIndicatorEnabled?: boolean;
    isEpisodeTitleIndexNumberEnabled?: boolean;
    isOfficialRatingEnabled?: boolean;
    isStarRatingEnabled?: boolean;
    isCaptionIndicatorEnabled?: boolean;
    isMissingIndicatorEnabled?: boolean;
    getMissingIndicator: () => React.JSX.Element | null
}

const PrimaryMediaInfo: FC<PrimaryMediaInfoProps> = ({
    className,
    item,
    isYearEnabled = false,
    isContainerEnabled = false,
    isEpisodeTitleEnabled = false,
    isCriticRatingEnabled = false,
    isEndsAtEnabled = false,
    isOriginalAirDateEnabled = false,
    isRuntimeEnabled = false,
    isProgramIndicatorEnabled = false,
    isEpisodeTitleIndexNumberEnabled = false,
    isOfficialRatingEnabled = false,
    isStarRatingEnabled = false,
    isCaptionIndicatorEnabled = false,
    isMissingIndicatorEnabled = false,
    getMissingIndicator
}) => {
    const miscInfo = usePrimaryMediaInfo({
        item,
        isYearEnabled,
        isContainerEnabled,
        isEpisodeTitleEnabled,
        isOriginalAirDateEnabled,
        isRuntimeEnabled,
        isProgramIndicatorEnabled,
        isEpisodeTitleIndexNumberEnabled,
        isOfficialRatingEnabled
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

            {isStarRatingEnabled && CommunityRating && (
                <StarIcons communityRating={CommunityRating} />
            )}

            {HasSubtitles && isCaptionIndicatorEnabled && <CaptionMediaInfo />}

            {CriticRating && isCriticRatingEnabled && (
                <CriticRatingMediaInfo criticRating={CriticRating} />
            )}

            {isEndsAtEnabled
                && MediaType === 'Video'
                && RunTimeTicks
                && !StartDate && <EndsAt runTimeTicks={RunTimeTicks} />}

            {isMissingIndicatorEnabled && (
                getMissingIndicator()
            )}
        </Box>
    );
};

export default PrimaryMediaInfo;
