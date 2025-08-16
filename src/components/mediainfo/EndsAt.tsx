import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import mediainfo from './mediainfo';

interface EndsAtProps {
    className?: string;
    runTimeTicks: number;
    positionTicks?: number;
}

const EndsAt: FC<EndsAtProps> = ({ runTimeTicks, positionTicks, className }) => {
    const cssClass = classNames(
        'mediaInfoItem',
        'endsAt',
        className
    );

    const playbackRate = 1;
    const includeText = true;

    const displayTime = mediainfo.getEndsAtFromPosition(runTimeTicks, positionTicks, playbackRate, includeText);

    return (
        <Box className={cssClass}>
            {displayTime}
        </Box>
    );
};

export default EndsAt;
