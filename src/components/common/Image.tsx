import React, { type FC, useCallback, useState } from 'react';
import { BlurhashCanvas } from 'react-blurhash';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import * as userSettings from '../../scripts/settings/userSettings';

const imageStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    zIndex: 0
};

interface ImageProps {
    imgUrl: string;
    blurhash?: string;
    containImage: boolean;
}

const Image: FC<ImageProps> = ({
    imgUrl,
    blurhash,
    containImage
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isTransitionComplete, setIsTransitionComplete] = useState(false);
    const [isLoadStarted, setIsLoadStarted] = useState(false);

    const fadeinDuration = userSettings.enableFastFadein() ? '0.1s' : '0.5s';
    const transitionDuration = isLoaded ? fadeinDuration : 'none';

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const handleTransitionEnd = useCallback(() => {
        setIsTransitionComplete(true);
    }, []);

    const handleLoadStarted = useCallback(() => {
        setIsLoadStarted(true);
    }, []);

    return (
        <div>
            {!isTransitionComplete && isLoadStarted && blurhash && userSettings.enableBlurhash() && (
                <BlurhashCanvas
                    hash={blurhash}
                    width= {20}
                    height={20}
                    punch={1}
                    style={{
                        ...imageStyle,
                        borderRadius: '0.2em',
                        pointerEvents: 'none'
                    }}
                />
            )}
            <LazyLoadImage
                key={imgUrl}
                src={imgUrl}
                style={{
                    ...imageStyle,
                    objectFit: containImage ? 'contain' : 'cover',
                    opacity: isLoaded ? 1 : 0,
                    transition: transitionDuration
                }}
                onLoad={handleLoad}
                onTransitionEnd={handleTransitionEnd}
                beforeLoad={handleLoadStarted}
            />

        </div>
    );
};

export default Image;
