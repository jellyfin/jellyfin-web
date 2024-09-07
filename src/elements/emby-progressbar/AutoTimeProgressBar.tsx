import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
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
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const theme = useTheme();

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
            variant='determinate'
            value={progress}
            sx={{
                [`& .${linearProgressClasses.bar}`]: {
                    borderRadius: 5,
                    backgroundColor: isRecording ? theme.palette.error.main : theme.palette.primary.main
                }
            }}
        />
    );
};

export default AutoTimeProgressBar;
