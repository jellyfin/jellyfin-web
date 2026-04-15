import { ApiClient } from 'jellyfin-apiclient';
import React, { type FC, useCallback, useEffect, useState } from 'react';
import Events, { Event } from 'utils/events';
import serverNotifications from 'scripts/serverNotifications';
import classNames from 'classnames';

import CircularProgress, {
    CircularProgressProps
} from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { toPercentString } from 'utils/number';
import { getCurrentDateTimeLocale } from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import { useApi } from 'hooks/useApi';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';
import { RefreshProgressMessage } from '@jellyfin/sdk/lib/generated-client';

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
                    {toPercentString(props.value / 100, getCurrentDateTimeLocale())}
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
    const [showProgressBar, setShowProgressBar] = useState(!!item.RefreshProgress);
    const [progress, setProgress] = useState(item.RefreshProgress || 0);

    const { api } = useApi()

    const onRefreshProgress = useCallback(({ Data }: RefreshProgressMessage) => {
        if (Data?.ItemId === item?.Id) {
            const pct = Data?.Progress ? parseFloat(Data?.Progress) : 0;

            if (pct && pct < 100) {
                setShowProgressBar(true);
            } else {
                setShowProgressBar(false);
            }

            setProgress(pct);
        }
    }, [item?.Id]);

    useEffect(() => {
        return api?.subscribe([OutboundWebSocketMessageType.RefreshProgress], onRefreshProgress);
    }, [item.Id]);

    const progressringClass = classNames('progressring', className);

    return showProgressBar ? (
        <div className={progressringClass}>
            <CircularProgressWithLabel value={Math.floor(progress)} />
        </div>
    ) : null;
};

export default RefreshIndicator;
