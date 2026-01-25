import React, { type FC, useCallback, useState } from 'react';
import { BlurhashCanvas } from 'react-blurhash';

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

const Image: FC<ImageProps> = ({ imgUrl, blurhash, containImage }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoadStarted, setIsLoadStarted] = useState(false);
    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const handleLoadStarted = useCallback(() => {
        setIsLoadStarted(true);
    }, []);

    return (
        <div>
            {!isLoaded && isLoadStarted && blurhash && (
                <BlurhashCanvas
                    hash={blurhash}
                    width={20}
                    height={20}
                    punch={1}
                    style={{
                        ...imageStyle,
                        borderRadius: '0.2em',
                        pointerEvents: 'none'
                    }}
                />
            )}
            <img
                key={imgUrl}
                src={imgUrl}
                alt=""
                style={{
                    ...imageStyle,
                    objectFit: containImage ? 'contain' : 'cover'
                }}
                onLoad={handleLoad}
                onError={handleLoadStarted}
                decoding="async"
            />
        </div>
    );
};

export default Image;
