/**
 * DiscImage - Spinning vinyl/CD disc artwork
 */

import { type ReactElement } from 'react';
import { AlbumArt } from '../AlbumArt';
import { discContainer, discGroove, discSpindle, spinning } from './DiscImage.css.ts';

export interface DiscImageProps {
    readonly src?: string | null;
    readonly isPlaying?: boolean;
    readonly spinDuration?: number;
    readonly size?: number | string;
    readonly alt?: string;
    readonly priority?: boolean;
    readonly className?: string;
}

export function DiscImage({
    src,
    isPlaying = false,
    spinDuration = 3,
    size = 300,
    alt = 'Album artwork',
    priority = false,
    className
}: DiscImageProps): ReactElement {
    const containerStyle: React.CSSProperties = {
        width: size,
        height: size
    };

    if (spinDuration > 0) {
        containerStyle.animationDuration = `${spinDuration}s`;
    }

    return (
        <div className={`${discContainer} ${isPlaying ? spinning : ''} ${className ?? ''}`} style={containerStyle}>
            <AlbumArt src={src} alt={alt} size="100%" priority={priority} />

            <div className={discGroove} />

            <div className={discSpindle} />
        </div>
    );
}
