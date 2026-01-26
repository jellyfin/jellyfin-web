import { Root, Indicator } from '@radix-ui/react-progress';
import React, { type ReactElement, type CSSProperties } from 'react';
import { progressRoot, progressIndicator } from './Progress.css';

export const progressStyles = {
    root: progressRoot,
    indicator: progressIndicator
};

interface ProgressProps {
    readonly value?: number;
    readonly max?: number;
    readonly className?: string;
    readonly style?: CSSProperties;
}

export function Progress({ value = 0, max = 100, className, style: progressStyle }: ProgressProps): ReactElement {
    const percentage = (value / max) * 100;

    return (
        <Root className={`${progressRoot} ${className ?? ''}`} style={progressStyle} value={value} max={max}>
            <Indicator className={progressIndicator} style={{ transform: `translateX(-${100 - percentage}%)` }} />
        </Root>
    );
}

export { progressRoot, progressIndicator };
