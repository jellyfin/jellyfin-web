import React, { type ReactElement, type ReactNode, type CSSProperties } from 'react';
import { textStyles, textSizes, textWeights, textColors, textAlignments } from './Text.css';

export type TextSize = keyof typeof textSizes;
export type TextWeight = keyof typeof textWeights;
export type TextColor = keyof typeof textColors;
export type TextAlignment = keyof typeof textAlignments;

type TextElement = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'small' | 'strong' | 'em';

interface TextProps {
    readonly as?: TextElement;
    readonly size?: TextSize;
    readonly weight?: TextWeight;
    readonly color?: TextColor;
    readonly align?: TextAlignment;
    readonly children?: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly dangerouslySetInnerHTML?: { readonly __html: string };
    readonly noWrap?: boolean;
}

export function Text({
    as: Component = 'p',
    size = 'md',
    weight = 'normal',
    color = 'primary',
    align,
    children,
    className,
    style,
    dangerouslySetInnerHTML,
    noWrap
}: TextProps): ReactElement {
    return (
        <Component
            className={[
                textStyles,
                textSizes[size],
                textWeights[weight],
                textColors[color],
                align !== undefined ? textAlignments[align] : '',
                className ?? ''
            ].join(' ')}
            style={{ ...style, whiteSpace: noWrap === true ? 'nowrap' : undefined }}
            dangerouslySetInnerHTML={dangerouslySetInnerHTML}
        >
            {dangerouslySetInnerHTML === undefined ? children : null}
        </Component>
    );
}

export const Heading = {
    H1: (props: Omit<TextProps, 'as' | 'size'>): ReactElement => <Text as="h1" size="9" weight="bold" {...props} />,
    H2: (props: Omit<TextProps, 'as' | 'size'>): ReactElement => <Text as="h2" size="8" weight="bold" {...props} />,
    H3: (props: Omit<TextProps, 'as' | 'size'>): ReactElement => <Text as="h3" size="7" weight="bold" {...props} />,
    H4: (props: Omit<TextProps, 'as' | 'size'>): ReactElement => <Text as="h4" size="6" weight="bold" {...props} />,
    H5: (props: Omit<TextProps, 'as' | 'size'>): ReactElement => <Text as="h5" size="5" weight="bold" {...props} />,
    H6: (props: Omit<TextProps, 'as' | 'size'>): ReactElement => <Text as="h6" size="4" weight="bold" {...props} />
};

export { textStyles, textSizes, textWeights, textColors, textAlignments };
