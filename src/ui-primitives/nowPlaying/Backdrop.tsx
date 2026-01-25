/**
 * Backdrop - Full-screen backdrop image with blur effect
 */

import { useState, useCallback, type ReactElement } from 'react';
import { backdrop, blur, overlay } from './Backdrop.css';

export interface BackdropProps {
    readonly src?: string | null;
    readonly blur?: boolean;
    readonly opacity?: number;
    readonly overlay?: boolean;
}

export function Backdrop({
    src,
    blur: showBlur = true,
    opacity = 0.6,
    overlay: showOverlay = true
}: BackdropProps): ReactElement | null {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoad = useCallback((): void => {
        setIsLoaded(true);
    }, []);

    const hasValidSrc = src !== null && src !== undefined && src !== '';

    if (!hasValidSrc) {
        return (
            <div
                className={backdrop}
                style={{
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }}
            >
                <div className={overlay} />
            </div>
        );
    }

    return (
        <div
            className={backdrop}
            style={{
                backgroundImage: `url(${src})`,
                opacity: isLoaded ? opacity : 0
            }}
        >
            {showBlur && <div className={blur} />}
            {showOverlay && <div className={overlay} />}
            <img src={src as string} alt='' style={{ display: 'none' }} onLoad={handleLoad} />
        </div>
    );
}
