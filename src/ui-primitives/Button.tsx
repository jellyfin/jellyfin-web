import React, { forwardRef, type ReactElement, type ElementType } from 'react';
import { buttonStyles, buttonVariants, buttonSizes, buttonFullWidth } from './Button.css';
import { vars } from '../styles/tokens.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'error' | 'outlined' | 'plain' | 'soft';
export type ButtonSize = keyof typeof buttonSizes;
export type ButtonColor = 'primary' | 'neutral' | 'danger' | 'success' | 'warning';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLElement> {
    readonly children: React.ReactNode;
    readonly variant?: ButtonVariant;
    readonly size?: ButtonSize;
    readonly color?: ButtonColor;
    readonly fullWidth?: boolean;
    readonly disabled?: boolean;
    readonly loading?: boolean;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly title?: string;
    readonly startDecorator?: React.ReactNode;
    readonly startIcon?: React.ReactNode;
    readonly endDecorator?: React.ReactNode;
    readonly endIcon?: React.ReactNode;
    readonly type?: 'button' | 'submit' | 'reset';
    readonly component?: ElementType | string;
    readonly to?: string;
    readonly href?: string;
    readonly target?: string;
    readonly rel?: string;
    readonly onClick?: React.MouseEventHandler<HTMLElement>;
}

export const Button = forwardRef<HTMLElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            color = 'primary',
            fullWidth = false,
            disabled = false,
            loading = false,
            className,
            style: buttonStyle,
            title,
            startDecorator,
            startIcon,
            endDecorator,
            endIcon,
            type = 'button',
            component: Component = 'button',
            to,
            href,
            target,
            rel,
            onClick,
            ...props
        },
        ref
    ): ReactElement => {
        const effectiveStartDecorator = startDecorator ?? startIcon;
        const effectiveEndDecorator = endDecorator ?? endIcon;

        const variantClass = buttonVariants[variant];

        // Apply color logic for plain variant if neutral is requested
        const colorStyle: React.CSSProperties = {};
        if (color === 'neutral' && variant === 'plain') {
            colorStyle.color = vars.colors.textSecondary;
        }

        const buttonContent = loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                    style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }}
                />
                {children}
            </span>
        ) : (
            <span
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: effectiveStartDecorator !== undefined || effectiveEndDecorator !== undefined ? '8px' : 0
                }}
            >
                {effectiveStartDecorator}
                {children}
                {effectiveEndDecorator}
            </span>
        );

        const commonProps = {
            className: [
                buttonStyles,
                variantClass,
                buttonSizes[size],
                fullWidth ? buttonFullWidth : '',
                className ?? ''
            ].join(' '),
            disabled: disabled || loading,
            onClick: onClick,
            style: { ...colorStyle, ...buttonStyle },
            title: title,
            ...props
        };

        if (Component === 'button') {
            return (
                <button ref={ref as React.Ref<HTMLButtonElement>} type={type} {...commonProps}>
                    {buttonContent}
                </button>
            );
        }

        const CustomComponent = Component as ElementType;
        return (
            <CustomComponent ref={ref} to={to} href={href} target={target} rel={rel} {...commonProps}>
                {buttonContent}
            </CustomComponent>
        );
    }
);

Button.displayName = 'Button';

export { buttonStyles, buttonVariants, buttonSizes, buttonFullWidth };
