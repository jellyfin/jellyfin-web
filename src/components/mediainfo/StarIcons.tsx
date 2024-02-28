import React, { type FC } from 'react';
import classNames from 'classnames';
import StarIcon from '@mui/icons-material/Star';
import Box from '@mui/material/Box';

interface StarIconsProps {
    className?: string;
    communityRating: number;
}

const StarIcons: FC<StarIconsProps> = ({ className, communityRating }) => {
    const cssClass = classNames(
        'mediaInfoItem',
        'mediaInfoText',
        'starRatingContainer',
        className
    );

    return (
        <Box className={cssClass}>
            <StarIcon fontSize={'small'} sx={{
                color: '#f2b01e'
            }} />
            {communityRating.toFixed(1)}
        </Box>
    );
};

export default StarIcons;
