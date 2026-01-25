import React, { type ReactElement } from 'react';
import { avatarStyles, avatarVariants, avatarColors, avatarImage } from './Avatar.css';

interface AvatarProps {
    readonly src?: string;
    readonly alt?: string;
    readonly children?: React.ReactNode;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly variant?: 'plain' | 'soft' | 'solid';
    readonly color?: 'primary' | 'neutral' | 'danger' | 'warning' | 'success' | 'info';
}

export function Avatar({
    src,
    alt,
    children,
    className,
    style: avatarStyle,
    variant = 'soft',
    color
}: AvatarProps): ReactElement {
    return (
        <div
            className={[
                avatarStyles,
                avatarVariants[variant],
                color !== undefined ? avatarColors[color] : '',
                className ?? ''
            ].join(' ')}
            style={avatarStyle}
        >
            {src !== undefined && src !== '' ? <img src={src} alt={alt} className={avatarImage} /> : children}
        </div>
    );
}

export { avatarStyles, avatarVariants, avatarColors, avatarImage };
