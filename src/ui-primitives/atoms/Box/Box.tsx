import React, { type ReactElement, type ElementType } from 'react';
import { boxStyles } from './Box.css.ts';

export { boxStyles };

type BoxElement =
    | 'div'
    | 'span'
    | 'section'
    | 'article'
    | 'main'
    | 'header'
    | 'footer'
    | 'aside'
    | 'nav'
    | 'a'
    | 'select'
    | 'option'
    | 'label';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: BoxElement | ElementType | string;
    readonly component?: ElementType | string;
    readonly children?: React.ReactNode;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly dangerouslySetInnerHTML?: { readonly __html: string };
    readonly display?: 'flex' | 'inline-flex' | 'grid' | 'block' | 'inline' | 'none';
    readonly align?: string;
    readonly justify?: string;
    readonly wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    readonly direction?: 'row' | 'column';
    readonly gap?: string | number;
    readonly href?: string;
    readonly target?: string;
    readonly rel?: string;
    readonly to?: string;
    readonly src?: string;
    readonly alt?: string;
    readonly dir?: string;
    readonly onClick?: React.MouseEventHandler<HTMLElement>;
    readonly ref?: React.Ref<HTMLElement>;
}

export function Box({
    as = 'div',
    component,
    children,
    className,
    style: boxStyle,
    dangerouslySetInnerHTML,
    href,
    target,
    rel,
    to,
    src,
    alt,
    dir,
    onClick,
    ...props
}: BoxProps): ReactElement {
    const Tag = (component ?? as) as ElementType;
    return React.createElement(
        Tag,
        {
            className,
            style: boxStyle,
            dangerouslySetInnerHTML,
            href,
            target,
            rel,
            to,
            src,
            alt,
            dir,
            onClick,
            ...props
        },
        children
    );
}

export interface FlexComponent {
    (props: BoxProps): ReactElement;
    row: string;
    col: string;
}

export const Flex: FlexComponent = Object.assign(
    ({
        children,
        className,
        style,
        display = 'flex',
        align,
        justify,
        wrap,
        direction,
        gap,
        href,
        target,
        rel,
        to,
        onClick,
        ...props
    }: BoxProps): ReactElement => {
        const flexStyle: React.CSSProperties = {
            display,
            alignItems: align,
            justifyContent: justify,
            flexWrap: wrap,
            flexDirection: direction,
            gap,
            ...style
        };
        return (
            <Box
                className={`${boxStyles.flex} ${className ?? ''}`}
                style={flexStyle}
                href={href}
                target={target}
                rel={rel}
                to={to}
                onClick={onClick}
                {...props}
            >
                {children}
            </Box>
        );
    },
    {
        row: boxStyles.flexRow,
        col: boxStyles.flexCol
    }
);

export function FlexRow({
    children,
    className,
    style,
    align,
    justify,
    wrap,
    gap,
    href,
    target,
    rel,
    to,
    onClick,
    ...props
}: BoxProps): ReactElement {
    const flexStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap,
        gap,
        ...style
    };
    return (
        <Box
            className={`${boxStyles.flexRow} ${className ?? ''}`}
            style={flexStyle}
            href={href}
            target={target}
            rel={rel}
            to={to}
            onClick={onClick}
            {...props}
        >
            {children}
        </Box>
    );
}

export function FlexCol({
    children,
    className,
    style,
    align,
    justify,
    wrap,
    gap,
    href,
    target,
    rel,
    to,
    onClick,
    ...props
}: BoxProps): ReactElement {
    const flexStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap,
        gap,
        ...style
    };
    return (
        <Box
            className={`${boxStyles.flexCol} ${className ?? ''}`}
            style={flexStyle}
            href={href}
            target={target}
            rel={rel}
            to={to}
            onClick={onClick}
            {...props}
        >
            {children}
        </Box>
    );
}
