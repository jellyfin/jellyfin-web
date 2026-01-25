import React, { type CSSProperties, type KeyboardEvent, type MouseEventHandler, type ReactNode, type ReactElement } from 'react';
import { cardStyles, cardPadding, cardInteractive, cardHeader, cardBody, cardFooter } from './Card.css';

interface CardProps {
    readonly children: ReactNode;
    readonly interactive?: boolean;
    readonly className?: string;
    readonly onClick?: () => void;
    readonly onMouseEnter?: MouseEventHandler<HTMLDivElement>;
    readonly onMouseLeave?: MouseEventHandler<HTMLDivElement>;
    readonly style?: CSSProperties;
}

export function Card({
    children,
    interactive = false,
    className,
    onClick,
    onMouseEnter,
    onMouseLeave,
    style
}: CardProps): ReactElement {
    const isInteractive = Boolean(interactive) && Boolean(onClick);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (!isInteractive || onClick === undefined) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    };

    const interactiveProps = isInteractive ?
        {
            onClick: onClick,
            onKeyDown: handleKeyDown,
            onMouseEnter,
            onMouseLeave,
            tabIndex: 0,
            role: 'button'
        } :
        {};

    return (
        <div
            className={[cardStyles, cardPadding, isInteractive ? cardInteractive : '', className ?? ''].join(' ')}
            style={style}
            {...interactiveProps}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { readonly children: ReactNode; readonly className?: string }): ReactElement {
    return <div className={`${cardHeader} ${className ?? ''}`}>{children}</div>;
}

export function CardBody({
    children,
    className,
    style: bodyStyle
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return (
        <div className={`${cardBody} ${className ?? ''}`} style={bodyStyle}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className }: { readonly children: ReactNode; readonly className?: string }): ReactElement {
    return <div className={`${cardFooter} ${className ?? ''}`}>{children}</div>;
}

export { cardStyles, cardPadding, cardInteractive, cardHeader, cardBody, cardFooter };

