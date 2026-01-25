import React, { type ReactElement, type CSSProperties } from 'react';
import { vars } from '../styles/tokens.css';
import { circularProgressRoot, circularProgressSizes } from './CircularProgress.css';

interface CircularProgressProps {
    readonly value?: number;
    readonly max?: number;
    readonly size?: 'sm' | 'md' | 'lg' | 'xl';
    readonly className?: string;
    readonly style?: CSSProperties;
}

export function CircularProgress({
    value = 0,
    max = 100,
    size = 'lg',
    className,
    style: progressStyle
}: CircularProgressProps): ReactElement {
    const percentage = (value / max) * 100;

    const sizes = {
        sm: { viewBox: '0 0 16 16', strokeWidth: 2, r: 6 },
        md: { viewBox: '0 0 24 24', strokeWidth: 2.5, r: 9 },
        lg: { viewBox: '0 0 32 32', strokeWidth: 3, r: 12 },
        xl: { viewBox: '0 0 48 48', strokeWidth: 4, r: 18 }
    };

    const { viewBox, strokeWidth, r } = sizes[size];
    const dasharray = 2 * Math.PI * r;
    const strokeDashoffset = dasharray - (percentage / 100) * dasharray;

    return (
        <div
            className={`${circularProgressRoot} ${circularProgressSizes[size]} ${className ?? ''}`}
            style={progressStyle}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
        >
            <svg width="100%" height="100%" viewBox={viewBox} aria-hidden="true">
                <circle
                    cx="50%"
                    cy="50%"
                    r={r}
                    fill="none"
                    stroke={vars.colors.surfaceHover}
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx="50%"
                    cy="50%"
                    r={r}
                    fill="none"
                    stroke={vars.colors.primary}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: dasharray,
                        strokeDashoffset,
                        transformOrigin: 'center',
                        transform: 'rotate(-90deg)',
                        transition: 'stroke-dashoffset 660ms cubic-bezier(0.65, 0, 0.35, 1)'
                    }}
                />
            </svg>
        </div>
    );
}

export { circularProgressRoot, circularProgressSizes };
