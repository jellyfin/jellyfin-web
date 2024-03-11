import React, { type FC } from 'react';
import classNames from 'classnames';
import StarIcon from '@mui/icons-material/Star';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

interface StarIconsProps {
    className?: string;
    communityRating: number;
}

const StarIcons: FC<StarIconsProps> = ({ className, communityRating }) => {
    const theme = useTheme();
    const cssClass = classNames(
        'mediaInfoItem',
        'mediaInfoText',
        'starRatingContainer',
        className
    );

    return (
        <Box className={cssClass}>
            <StarIcon fontSize={'small'} sx={{
                color: theme.palette.starIcon.main
            }} />
            {communityRating.toFixed(1)}
        </Box>
    );
};

export default StarIcons;
