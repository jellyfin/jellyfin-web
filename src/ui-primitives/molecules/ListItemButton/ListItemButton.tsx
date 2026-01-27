import React, {
    type ReactElement,
    type ReactNode,
    type CSSProperties,
    type ElementType,
    type HTMLAttributes,
    type ButtonHTMLAttributes,
    type AnchorHTMLAttributes,
    type MouseEventHandler
} from 'react';
import {
    listItemButtonActive,
    listItemButtonStyles,
    listSubheaderSticky,
    listSubheaderStyles
} from './ListItemButton.css';

export { listItemButtonActive, listItemButtonStyles, listSubheaderSticky, listSubheaderStyles };

type ListItemButtonProps = {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly active?: boolean;
    readonly onClick?: MouseEventHandler<HTMLButtonElement>;
    readonly component?: ElementType;
    readonly href?: string;
    readonly to?: string;
    readonly target?: string;
    readonly rel?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'component'>;

export function ListItemButton({
    children,
    className,
    style: buttonStyle,
    active = false,
    component: Component = 'button',
    href,
    to,
    target,
    rel,
    ...props
}: ListItemButtonProps): ReactElement {
    const buttonClassName = `${listItemButtonStyles} ${active ? listItemButtonActive : ''} ${className ?? ''}`;

    if (Component !== 'button' && Component !== 'a') {
        const CustomComponent = Component as ElementType;
        return (
            <CustomComponent
                className={buttonClassName}
                style={buttonStyle}
                to={to}
                href={href}
                target={target}
                rel={rel}
                {...props}
            >
                {children}
            </CustomComponent>
        );
    }

    if (Component === 'a' || href !== undefined || to !== undefined) {
        return (
            <a
                className={buttonClassName}
                style={buttonStyle}
                href={href ?? to}
                target={target}
                rel={rel}
                {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
            >
                {children}
            </a>
        );
    }

    return (
        <button
            className={buttonClassName}
            style={buttonStyle}
            type="button"
            {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
            {children}
        </button>
    );
}

interface ListSubheaderProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly sticky?: boolean;
}

export function ListSubheader({ children, className, sticky = false }: ListSubheaderProps): ReactElement {
    return (
        <div className={`${listSubheaderStyles} ${sticky ? listSubheaderSticky : ''} ${className ?? ''}`}>
            {children}
        </div>
    );
}
