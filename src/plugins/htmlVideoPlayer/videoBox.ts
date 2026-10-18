interface Size {
    width: number;
    height: number;
}

/**
 * Gets the size of the box showing a video inside a container for the given aspect ratio setting.
 * Returns undefined when the box should fill the container.
 */
export function getVideoBoxSize(video: Size, container: Size, aspectRatio?: string): Size | undefined {
    if (!video.width || !video.height || aspectRatio === 'fill') {
        return undefined;
    }

    const fit = aspectRatio === 'cover' ? Math.max : Math.min;
    const scale = fit(container.width / video.width, container.height / video.height);

    return {
        width: Math.round(video.width * scale),
        height: Math.round(video.height * scale)
    };
}
