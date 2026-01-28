import React, { type FC, useCallback, useEffect, useState } from 'react';
import Events, { Event } from 'utils/events';
import serverNotifications from 'scripts/serverNotifications';
import classNames from 'classnames';
import { deprecate } from '../../utils/deprecation';

import { Box } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import { toPercentString } from 'utils/number';
import { getCurrentDateTimeLocale } from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';

function CircularProgressWithLabel(props: { value: number }) {
    const size = 40;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedValue = Math.max(0, Math.min(100, props.value));
    const offset = circumference - (clampedValue / 100) * circumference;

    return (
        <Box style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={vars.colors.surfaceHover}
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={vars.colors.primary}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.2s ease' }}
                />
            </svg>
            <Box
                style={{
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
                <Text size="xs" color="secondary">
                    {toPercentString(props.value / 100, getCurrentDateTimeLocale()) ?? ''}
                </Text>
            </Box>
        </Box>
    );
}

interface RefreshIndicatorProps {
    readonly item: ItemDto;
    readonly className?: string;
}

const RefreshIndicator: FC<RefreshIndicatorProps> = ({ item, className }) => {
    deprecate(
        'emby-itemrefreshindicator/RefreshIndicator',
        'ui-primitives/CircularProgress',
        'src/elements/emby-itemrefreshindicator/RefreshIndicator.tsx'
    );

    const [showProgressBar, setShowProgressBar] = useState(item.RefreshProgress !== undefined && item.RefreshProgress !== null);
    const [progress, setProgress] = useState(item.RefreshProgress ?? 0);

    const onRefreshProgress = useCallback(
        (_e: Event, _apiClient: unknown, info: { ItemId: string | null | undefined; Progress: string }) => {
            if (info.ItemId === item?.Id) {
                const pct = parseFloat(info.Progress);

                if (pct > 0 && pct < 100) {
                    setShowProgressBar(true);
                } else {
                    setShowProgressBar(false);
                }

                setProgress(pct);
            }
        },
        [item?.Id]
    );

    const unbindEvents = useCallback(() => {
        if (item?.Id !== undefined && item?.Id !== null && item?.Id !== '') {
            Events.off(serverNotifications, 'RefreshProgress', onRefreshProgress);
        }
    }, [item?.Id, onRefreshProgress]);

    const bindEvents = useCallback(() => {
        unbindEvents();

        if (item?.Id !== undefined && item?.Id !== null && item?.Id !== '') {
            Events.on(serverNotifications, 'RefreshProgress', onRefreshProgress);
        }
    }, [item?.Id, unbindEvents, onRefreshProgress]);

    useEffect(() => {
        bindEvents();

        return () => {
            unbindEvents();
        };
    }, [bindEvents, item.Id, unbindEvents]);

    const progressringClass = classNames('progressring', className);

    return showProgressBar ? (
        <div className={progressringClass}>
            <CircularProgressWithLabel value={Math.floor(progress)} />
        </div>
    ) : null;
};

export default RefreshIndicator;
