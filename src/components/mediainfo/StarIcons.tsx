import React, { type FC } from 'react';
import classNames from 'classnames';
import StarIcon from '@mui/icons-material/Star';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

interface StarIconsProps {
    className?: string;
    communityRating: number;
}

//the star icon is slightly off from the old material icons version. It should be about 1.13em and have a small right margin
const StarStyle: React.CSSProperties = {
    width: '1.13em',
    height: '1.31em',
    marginRight: '0.125em'
};

const StarIcons: FC<StarIconsProps> = ({ className, communityRating }) => {
    const theme = useTheme();
    const cssClass = classNames(
        'mediaInfoItem',
        'starRatingContainer',
        className
    );

    return (
        <Box className={cssClass}>
            <StarIcon
                style={StarStyle}
                fontSize={'small'}
                sx={{
                    color: theme.palette.starIcon.main
                }}
            />
            {communityRating.toFixed(1)}
        </Box>
    );
};

export default StarIcons;
