import React, { type FC, useCallback, useEffect, useState } from 'react';
import Events, { Event } from 'utils/events';
import serverNotifications from 'scripts/serverNotifications';
import classNames from 'classnames';

import CircularProgress, {
    CircularProgressProps
} from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { toPercent } from 'utils/number';
import { getCurrentDateTimeLocale } from 'scripts/globalize';
import type { ItemDto } from 'types/base/models/item-dto';

function CircularProgressWithLabel(
    props: CircularProgressProps & { value: number }
) {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant='determinate' {...props} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Typography
                    variant='caption'
                    component='div'
                    color='text.secondary'
                >
                    {toPercent(props.value / 100, getCurrentDateTimeLocale())}
                </Typography>
            </Box>
        </Box>
    );
}

interface RefreshIndicatorProps {
    item: ItemDto;
    className?: string;
}

const RefreshIndicator: FC<RefreshIndicatorProps> = ({ item, className }) => {
    const [progress, setProgress] = useState(item.RefreshProgress || 0);

    const onRefreshProgress = useCallback((_e: Event, apiClient, info) => {
        if (info.ItemId === item?.Id) {
            setProgress(parseFloat(info.Progress));
        }
    }, [item?.Id]);

    const unbindEvents = useCallback(() => {
        Events.off(serverNotifications, 'RefreshProgress', onRefreshProgress);
    }, [onRefreshProgress]);

    const bindEvents = useCallback(() => {
        unbindEvents();

        if (item?.Id) {
            Events.on(serverNotifications, 'RefreshProgress', onRefreshProgress);
        }
    }, [item?.Id, onRefreshProgress, unbindEvents]);

    useEffect(() => {
        bindEvents();

        return () => {
            unbindEvents();
        };
    }, [bindEvents, item.Id, unbindEvents]);

    const progressringClass = classNames(
        'progressring',
        className,
        { 'hide': !progress || progress >= 100 }
    );

    return (
        <div className={progressringClass}>
            <CircularProgressWithLabel value={Math.floor(progress)} />
        </div>
    );
};

export default RefreshIndicator;
