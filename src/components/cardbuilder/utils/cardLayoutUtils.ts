import layoutManager from '../../layoutManager';

export function getImageWidth(shape: string, screenWidth: number, isOrientationLandscape: boolean): number {
    const imagesPerRow = getPostersPerRow(shape, screenWidth, isOrientationLandscape, layoutManager.tv);
    return Math.round(screenWidth / imagesPerRow);
}

export function getPostersPerRow(
    shape: string,
    _screenWidth: number,
    isOrientationLandscape: boolean,
    isTv: boolean
): number {
    const imagesPerRow: any = {};

    if (isTv) {
        imagesPerRow.banner = 8;
        imagesPerRow.smallBackdrop = 4;
        imagesPerRow.backdrop = 4;
        imagesPerRow.square = 6;
        imagesPerRow.portrait = 6;
    } else {
        if (isOrientationLandscape) {
            imagesPerRow.banner = 5;
            imagesPerRow.smallBackdrop = 5;
            imagesPerRow.backdrop = 4;
            imagesPerRow.square = 5;
            imagesPerRow.portrait = 5;
        } else {
            imagesPerRow.banner = 5;
            imagesPerRow.smallBackdrop = 5;
            imagesPerRow.backdrop = 3;
            imagesPerRow.square = 3;
            imagesPerRow.portrait = 4;
        }
    }

    return imagesPerRow[shape] || 5;
}

export function isResizable(width: number): boolean {
    return width >= 600;
}
