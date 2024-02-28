import React, { type FC } from 'react';
import classNames from 'classnames';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import Box from '@mui/material/Box';

interface CaptionMediaInfoProps {
    className?: string;
}

const CaptionMediaInfo: FC<CaptionMediaInfoProps> = ({ className }) => {
    const cssClass = classNames(
        'mediaInfoItem',
        'mediaInfoText',
        'closedCaptionMediaInfoText',
        className
    );

    return (
        <Box className={cssClass}>
            <ClosedCaptionIcon fontSize={'small'} />
        </Box>
    );
};

export default CaptionMediaInfo;
