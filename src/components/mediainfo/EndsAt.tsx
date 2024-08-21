import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';

interface EndsAtProps {
    className?: string;
    runTimeTicks: number
}

const EndsAt: FC<EndsAtProps> = ({ runTimeTicks, className }) => {
    const cssClass = classNames(
        'mediaInfoItem',
        'endsAt',
        className
    );

    const endTime = new Date().getTime() + (runTimeTicks / 10000);
    const endDate = new Date(endTime);
    const displayTime = datetime.getDisplayTime(endDate);

    return (
        <Box className={cssClass}>
            {globalize.translate('EndsAtValue', displayTime)}
        </Box>
    );
};

export default EndsAt;
