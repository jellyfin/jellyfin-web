import React, { type FC } from 'react';
import classNames from 'classnames';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import Box from '@mui/material/Box/Box';

interface CaptionMediaInfoProps {
    className?: string;
}

const CaptionMediaInfo: FC<CaptionMediaInfoProps> = ({ className }) => {
    const cssClass = classNames(
        'mediaInfoItem',
        'closedCaptionMediaInfoText',
        className
    );

    return (
        <Box className={cssClass}>
            <ClosedCaptionIcon />
        </Box>
    );
};

export default CaptionMediaInfo;
