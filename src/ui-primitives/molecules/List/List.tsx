import React, { type ReactElement, type ReactNode, type CSSProperties, type MouseEvent } from 'react';
import {
    listStyles,
    listSizes,
    listNested,
    listItemStyles,
    listItemContentStyles,
    listItemDecorator,
    listSubheaderStyles,
    listSubheaderSticky,
    listItemButtonStyles,
    listItemAvatarStyles,
    listItemTextStyles
} from './List.css.ts';

export interface ListProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly size?: 'sm' | 'md' | 'lg';
    readonly nested?: boolean;
    readonly subheader?: ReactNode;
}

export function List({
    children,
    className,
    style: listStyle,
    size = 'md',
    nested = false,
    subheader
}: ListProps): ReactElement {
    return (
        <ul className={`${listStyles} ${nested ? listNested : listSizes[size]} ${className ?? ''}`} style={listStyle}>
            {subheader}
            {children}
        </ul>
    );
}

export interface ListItemProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly nested?: boolean;
    readonly endAction?: ReactNode;
    readonly disablePadding?: boolean;
    readonly ref?: React.Ref<HTMLLIElement>;
}

export function ListItem({
    children,
    className,
    style: itemStyle,
    disablePadding = false,
    ref
}: ListItemProps): ReactElement {
    return (
        <li
            ref={ref}
            className={`${listItemStyles} ${className ?? ''}`}
            style={{
                padding: disablePadding ? 0 : undefined,
                ...itemStyle
            }}
        >
            {children}
        </li>
    );
}



export function ListItemContent({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <div className={`${listItemContentStyles} ${className ?? ''}`}>{children}</div>;
}

export function ListItemDecorator({
    children,
    className,
    style
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return (
        <span className={`${listItemDecorator} ${className ?? ''}`} style={style}>
            {children}
        </span>
    );
}

export function ListItemAvatar({
    children,
    className,
    style
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return (
        <div className={`${listItemAvatarStyles} ${className ?? ''}`} style={style}>
            {children}
        </div>
    );
}

export function ListItemText({
    primary,
    secondary,
    className
}: {
    readonly primary: ReactNode;
    readonly secondary?: ReactNode;
    readonly className?: string;
}): ReactElement {
    return (
        <div className={`${listItemTextStyles} ${className ?? ''}`}>
            <div>{primary}</div>
            {secondary !== undefined && <div style={{ opacity: 0.7 }}>{secondary}</div>}
        </div>
    );
}

export interface ListSubheaderProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly sticky?: boolean;
    readonly id?: string;
}

export function ListSubheader({ children, className, sticky = false, id }: ListSubheaderProps): ReactElement {
    return (
        <div className={`${listSubheaderStyles} ${sticky ? listSubheaderSticky : ''} ${className ?? ''}`} id={id}>
            {children}
        </div>
    );
}

export {
    listStyles,
    listSizes,
    listNested,
    listItemStyles,
    listItemContentStyles,
    listItemDecorator,
    listSubheaderStyles,
    listSubheaderSticky,
    listItemAvatarStyles,
    listItemTextStyles
};
