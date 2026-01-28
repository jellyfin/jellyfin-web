import type { ReactElement } from 'react';
import { skeletonRoot, skeletonWave } from './Skeleton.css.ts';

export interface SkeletonProps {
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly width?: number | string;
    readonly height?: number | string;
    readonly variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({
    className,
    style: skeletonStyle,
    width,
    height,
    variant = 'rectangular'
}: SkeletonProps): ReactElement {
    let borderRadius = '4px';
    if (variant === 'circular') {
        borderRadius = '50%';
    } else if (variant === 'text') {
        borderRadius = '2px';
    }

    const inlineStyle: React.CSSProperties = {
        width,
        height,
        borderRadius,
        ...skeletonStyle
    };

    return <div className={`${skeletonRoot} ${className ?? ''}`} style={inlineStyle} />;
}

export { skeletonRoot, skeletonWave };
