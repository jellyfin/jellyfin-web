import { Indicator, Root } from '@radix-ui/react-progress';
import React, { type CSSProperties, type ReactElement } from 'react';
import { progressIndicator, progressRoot } from './Progress.css.ts';

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

export function Progress({
    value = 0,
    max = 100,
    className,
    style: progressStyle
}: ProgressProps): ReactElement {
    const percentage = (value / max) * 100;

    return (
        <Root
            className={`${progressRoot} ${className ?? ''}`}
            style={progressStyle}
            value={value}
            max={max}
        >
            <Indicator
                className={progressIndicator}
                style={{ transform: `translateX(-${100 - percentage}%)` }}
            />
        </Root>
    );
}

export { progressRoot, progressIndicator };
