import React, { type FC } from 'react';
import classNames from 'classnames';
import { Box } from 'ui-primitives';

interface StarIconsProps {
    className?: string;
    communityRating: number;
}

const StarIcons: FC<StarIconsProps> = ({ className, communityRating }) => {
    const cssClass = classNames('mediaInfoItem', 'starRatingContainer', className);

    return (
        <Box className={cssClass}>
            <span className="material-icons starIcon" aria-hidden="true">
                star
            </span>
            {communityRating.toFixed(1)}
        </Box>
    );
};

export default StarIcons;
