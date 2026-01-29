import React, {
    type CSSProperties,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode
} from 'react';
import { chipSizes, chipStyles, chipVariants } from './Chip.css.ts';

export type ChipVariant = keyof typeof chipVariants;
export type ChipSize = keyof typeof chipSizes;

interface ChipProps {
    readonly variant?: ChipVariant;
    readonly size?: ChipSize;
    readonly children: ReactNode;
    readonly startDecorator?: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly onClick?: () => void;
}

export function Chip({
    variant = 'secondary',
    size = 'md',
    children,
    startDecorator,
    className,
    style,
    onClick
}: ChipProps): ReactElement {
    const isInteractive = onClick !== undefined;

    const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>): void => {
        if (onClick !== undefined && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick();
        }
    };

    const interactiveProps = isInteractive
        ? {
              onClick,
              onKeyDown: handleKeyDown,
              tabIndex: 0,
              role: 'button'
          }
        : {};

    return (
        <span
            className={`${chipStyles} ${chipVariants[variant]} ${chipSizes[size]} ${className ?? ''}`}
            style={style}
            {...interactiveProps}
        >
            {startDecorator !== undefined && (
                <span style={{ display: 'flex', alignItems: 'center' }}>{startDecorator}</span>
            )}
            {children}
        </span>
    );
}

export { chipSizes, chipStyles, chipVariants } from './Chip.css.ts';
