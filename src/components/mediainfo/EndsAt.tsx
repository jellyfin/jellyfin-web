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

    const [displayTime, setDisplayTime] = React.useState(null);
    const intervalRef = React.useRef<ReturnType<typeof setInterval>>();

    const calculateNewTime = React.useCallback(() => {
        const endTime = new Date().getTime() + (runTimeTicks / 10000);
        const endDate = new Date(endTime);
        setDisplayTime(datetime.getDisplayTime(endDate));
    }, [runTimeTicks]);

    React.useEffect(() => {
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            calculateNewTime();
        }, 60000);

        calculateNewTime();

        return () => {
            clearInterval(intervalRef.current);
        };
    }, [calculateNewTime]);

    if (!displayTime) {
        return null;
    }

    return (
        <Box className={cssClass}>
            {globalize.translate('EndsAtValue', displayTime)}
        </Box>
    );
};

export default EndsAt;
