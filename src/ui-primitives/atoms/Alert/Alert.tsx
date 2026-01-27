import React, { type ReactElement } from 'react';
import { alertStyles, alertVariants } from './Alert.css';
import { vars } from '../../../styles/tokens.css';

export type AlertVariant = keyof typeof alertVariants;

interface AlertProps {
    readonly variant?: AlertVariant;
    readonly severity?: AlertVariant;
    readonly children: React.ReactNode;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly action?: React.ReactNode;
}

export function Alert({
    variant = 'error',
    severity,
    children,
    className,
    style: alertStyle,
    action
}: AlertProps): ReactElement {
    const effectiveVariant = severity ?? variant;

    return (
        <div
            className={`${alertStyles} ${alertVariants[effectiveVariant]} ${className ?? ''}`}
            style={alertStyle}
            role="alert"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing.sm }}>
                <div>{children}</div>
                {action !== undefined && <div>{action}</div>}
            </div>
        </div>
    );
}

export { alertStyles, alertVariants };
