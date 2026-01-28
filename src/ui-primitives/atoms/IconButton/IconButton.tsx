import React, { type ReactElement, type ReactNode, type CSSProperties, type MouseEventHandler } from 'react';
import { iconButtonStyles, iconButtonVariants, iconButtonSizes, iconButtonColors } from './IconButton.css.ts';

export type IconButtonVariant = keyof typeof iconButtonVariants;
export type IconButtonSize = keyof typeof iconButtonSizes;
export type IconButtonColor = 'primary' | 'neutral' | 'danger' | 'warning' | 'success' | 'info';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    readonly variant?: IconButtonVariant;
    readonly size?: IconButtonSize;
    readonly color?: IconButtonColor;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly title?: string;
    readonly disabled?: boolean;
    readonly onClick?: MouseEventHandler<HTMLButtonElement>;
    readonly children: ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        {
            variant = 'plain',
            size = 'md',
            color,
            className,
            style,
            title,
            disabled = false,
            onClick,
            children,
            ...props
        },
        ref
    ): ReactElement => {
        return (
            <button
                ref={ref}
                type="button"
                className={[
                    iconButtonStyles,
                    iconButtonVariants[variant],
                    iconButtonSizes[size],
                    color !== undefined ? iconButtonColors[color] : '',
                    className ?? ''
                ].join(' ')}
                style={style}
                title={title}
                disabled={disabled}
                onClick={onClick}
                {...props}
            >
                {children}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';

export { iconButtonStyles, iconButtonVariants, iconButtonSizes };
