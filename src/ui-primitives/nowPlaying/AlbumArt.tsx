/**
 * AlbumArt - Album artwork display with fallback
 */

import { useState, useCallback, type ReactElement } from 'react';
import { container, image, placeholder } from './AlbumArt.css';

export interface AlbumArtProps {
    readonly src?: string | null;
    readonly alt?: string;
    readonly size?: number | string;
    readonly aspectRatio?: string;
    readonly priority?: boolean;
    readonly className?: string;
}

export function AlbumArt({
    src,
    alt = 'Album artwork',
    size,
    aspectRatio = '1',
    priority = false,
    className
}: AlbumArtProps): ReactElement {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const styleProp = typeof size === 'number' ? { width: size, height: size } : undefined;

    const handleLoad = useCallback((): void => {
        setIsLoaded(true);
    }, []);

    const handleError = useCallback((): void => {
        setHasError(true);
    }, []);

    const showImage = src !== null && src !== undefined && src !== '' && !hasError;

    return (
        <div className={`${container} ${className ?? ''}`} style={styleProp}>
            {showImage ? (
                <img
                    src={src as string}
                    alt={alt}
                    className={image}
                    style={{
                        opacity: isLoaded ? 1 : 0,
                        aspectRatio
                    }}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding={priority ? 'sync' : 'async'}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            ) : (
                <div className={placeholder} style={{ aspectRatio }}>
                    No Art
                </div>
            )}
        </div>
    );
}
