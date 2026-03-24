import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import globalize from 'lib/globalize';
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

    const time = mediainfo.getEndsAtFromPosition(runTimeTicks, positionTicks, 1, false);
    const displayTime = '(' + globalize.translate('EndsAtIfStartedNowValue', time) + ')';

    return (
        <Box className={cssClass}>
            {displayTime}
        </Box>
    );
};

export default EndsAt;
