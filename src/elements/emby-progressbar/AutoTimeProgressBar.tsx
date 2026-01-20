import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import LinearProgress from '@mui/joy/LinearProgress';

import type { ProgressOptions } from 'types/progressOptions';

interface AutoTimeProgressBarProps {
    pct: number;
    starTtime: number;
    endTtime: number;
    isRecording: boolean;
    dataAutoMode?: string;
    progressOptions?: ProgressOptions;
}

const AutoTimeProgressBar: FC<AutoTimeProgressBarProps> = ({
    pct,
    dataAutoMode,
    isRecording,
    starTtime,
    endTtime,
    progressOptions
}) => {
    const [progress, setProgress] = useState(pct);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const onAutoTimeProgress = useCallback(() => {
        const start = parseInt(starTtime.toString(), 10);
        const end = parseInt(endTtime.toString(), 10);

        const now = new Date().getTime();
        const total = end - start;
        let percentage = 100 * ((now - start) / total);

        percentage = Math.min(100, percentage);
        percentage = Math.max(0, percentage);

        setProgress(percentage);
    }, [endTtime, starTtime]);

    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        if (dataAutoMode === 'time') {
            timerRef.current = setInterval(onAutoTimeProgress, 60000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [dataAutoMode, onAutoTimeProgress]);

    const progressBarClass = classNames(
        'itemLinearProgress',
        progressOptions?.containerClass
    );

    return (
        <LinearProgress
            className={progressBarClass}
            determinate
            value={progress}
            color={isRecording ? 'danger' : 'primary'}
            sx={{
                borderRadius: 'sm',
                '--LinearProgress-thickness': '4px'
            }}
        />
    );
};

export default AutoTimeProgressBar;