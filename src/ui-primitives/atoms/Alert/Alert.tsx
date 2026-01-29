import React, { type ReactElement } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { alertStyles, alertVariants } from './Alert.css.ts';

export type AlertVariant = keyof typeof alertVariants;

interface AlertProps {
    readonly variant?: AlertVariant;
    readonly severity?: AlertVariant;
    readonly title?: string;
    readonly children: React.ReactNode;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly action?: React.ReactNode;
}

export function Alert({
    variant = 'error',
    severity,
    title,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['4'] }}>
                {title !== undefined && (
                    <div
                        style={{
                            fontWeight: vars.typography.fontWeightBold,
                            fontSize: vars.typography['3'].fontSize
                        }}
                    >
                        {title}
                    </div>
                )}
                <div>{children}</div>
                {action !== undefined && <div>{action}</div>}
            </div>
        </div>
    );
}

export { alertStyles, alertVariants };
