import { Portal, Content, Arrow, Close, Root, Trigger } from '@radix-ui/react-popover';
import React, { type ReactNode, type ReactElement } from 'react';
import {
    popoverContent,
    popoverArrow,
    popoverClose,
    popoverHeader,
    popoverTitle,
    popoverDescription,
    popoverFooter,
    alignVariants
} from './Popover.css.ts';

export { popoverContent, popoverArrow, popoverClose, popoverHeader, popoverTitle, popoverDescription, popoverFooter };

export type PopoverAlign = keyof typeof alignVariants;

interface PopoverContentProps {
    readonly children: ReactNode;
    readonly align?: PopoverAlign;
    readonly sideOffset?: number;
    readonly collisionPadding?: number;
    readonly className?: string;
    readonly style?: React.CSSProperties;
}

export function PopoverContent({
    children,
    align = 'start',
    sideOffset = 4,
    collisionPadding,
    className,
    style: contentStyle
}: PopoverContentProps): ReactElement {
    return (
        <Portal>
            <Content
                className={`${popoverContent} ${alignVariants[align]} ${className ?? ''}`}
                align={align}
                sideOffset={sideOffset}
                collisionPadding={collisionPadding}
                style={contentStyle}
            >
                {children}
                <Arrow className={popoverArrow} />
            </Content>
        </Portal>
    );
}

export function PopoverArrow({
    width = 10,
    height = 5
}: {
    readonly width?: number;
    readonly height?: number;
}): ReactElement {
    return (
        <Arrow
            className={popoverArrow}
            style={
                {
                    '--radix-popover-arrow-width': `${width}px`,
                    '--radix-popover-arrow-height': `${height}px`
                } as React.CSSProperties
            }
        />
    );
}

export function PopoverClose({
    children,
    onClick,
    'aria-label': ariaLabel
}: {
    readonly children?: ReactNode;
    readonly onClick?: () => void;
    readonly 'aria-label'?: string;
}): ReactElement {
    return (
        <Close asChild onClick={onClick}>
            <button type="button" className={popoverClose} aria-label={ariaLabel ?? 'Close'}>
                {children ?? (
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                )}
            </button>
        </Close>
    );
}

export function PopoverHeader({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <div className={`${popoverHeader} ${className ?? ''}`}>{children}</div>;
}

export function PopoverTitle({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <h3 className={`${popoverTitle} ${className ?? ''}`}>{children}</h3>;
}

export function PopoverDescription({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <p className={`${popoverDescription} ${className ?? ''}`}>{children}</p>;
}

export function PopoverFooter({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <div className={`${popoverFooter} ${className ?? ''}`}>{children}</div>;
}

interface PopoverProps {
    readonly open?: boolean;
    readonly onOpenChange?: (open: boolean) => void;
    readonly children: ReactNode;
    readonly defaultOpen?: boolean;
}

export function Popover({ open, onOpenChange, children, defaultOpen }: PopoverProps): ReactElement {
    return (
        <Root open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
            {children}
        </Root>
    );
}

export function PopoverTrigger({
    asChild = true,
    children
}: {
    readonly asChild?: boolean;
    readonly children: ReactNode;
}): ReactElement {
    return <Trigger asChild={asChild}>{children}</Trigger>;
}

export function PopoverPortal({ children }: { readonly children: ReactNode }): ReactElement {
    return <Portal>{children}</Portal>;
}
