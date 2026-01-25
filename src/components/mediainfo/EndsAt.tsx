import React, { type FC } from 'react';
import classNames from 'classnames';
import { Box } from 'ui-primitives/Box';
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

    const displayTime = mediainfo.getEndsAtFromPosition(runTimeTicks, positionTicks, 1, true);

    return (
        <Box className={cssClass}>
            {displayTime}
        </Box>
    );
};

export default EndsAt;
