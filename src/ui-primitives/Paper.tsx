import React, { type ReactElement, type ReactNode, type CSSProperties } from 'react';
import { paperStyles, paperElevation } from './Paper.css';
import { vars } from '../styles/tokens.css';

export type PaperElevation = keyof typeof paperElevation;

interface PaperProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly elevation?: PaperElevation;
    readonly variant?: 'elevation' | 'outlined';
}

export function Paper({ children, className, style: paperStyle, elevation = 'md', variant = 'elevation' }: PaperProps): ReactElement {
    const isOutlined = variant === 'outlined';
    return (
        <div
            className={`${paperStyles} ${isOutlined ? '' : paperElevation[elevation]} ${className ?? ''}`}
            style={{
                border: isOutlined ? `1px solid ${vars.colors.divider}` : undefined,
                boxShadow: isOutlined ? 'none' : undefined,
                ...paperStyle
            }}
        >
            {children}
        </div>
    );
}

export { paperStyles, paperElevation };
