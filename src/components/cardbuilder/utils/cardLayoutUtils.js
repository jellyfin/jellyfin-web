import layoutManager from 'components/layoutManager';

export function getImageWidth(shape, screenWidth, isOrientationLandscape) {
    const imagesPerRow = getPostersPerRow(shape, screenWidth, isOrientationLandscape, layoutManager.tv);
    return Math.round(screenWidth / imagesPerRow);
}

function getPostersPerRow(shape, screenWidth, isOrientationLandscape, isTv) {
    const imagesPerRow = { };

    if (isTv) {
        if (isOrientationLandscape) {
            imagesPerRow.banner = 8;
            imagesPerRow.smallBackdrop = 4;
            imagesPerRow.backdrop = 4;
            imagesPerRow.square = 6;
            imagesPerRow.portrait = 6;
        } else {
            imagesPerRow.banner = 8;
            imagesPerRow.smallBackdrop = 4;
            imagesPerRow.backdrop = 4;
            imagesPerRow.square = 6;
            imagesPerRow.portrait = 6;
        }
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

function isResizable(width) {
    return width >= 600;
}
