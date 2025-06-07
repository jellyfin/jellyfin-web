import React, { type FC, useCallback, useState } from 'react';
import classNames from 'classnames';
import { Blurhash } from 'react-blurhash';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import './image.scss';

interface ImageProps {
    className?: string;
    imgUrl: string;
    blurhash?: string;
    containImage?: boolean;
}

export const Image: FC<ImageProps> = ({
    className,
    imgUrl,
    blurhash,
    containImage
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoadStarted, setIsLoadStarted] = useState(false);
    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const handleLoadStarted = useCallback(() => {
        setIsLoadStarted(true);
    }, []);

    return (
        <div className={classNames('image', className)}>
            {!isLoaded && isLoadStarted && blurhash && (
                <Blurhash
                    className='blurhash'
                    hash={blurhash}
                    width='100%'
                    height='100%'
                    resolutionX={20}
                    resolutionY={20}
                    punch={1}
                />
            )}
            <LazyLoadImage
                className='lazy-image'
                src={imgUrl}
                style={{
                    objectFit: containImage ? 'contain' : 'cover'
                }}
                onLoad={handleLoad}
                beforeLoad={handleLoadStarted}
            />
        </div>
    );
};
