const ASPECT_RATIOS = {
    portrait: (2 / 3),
    backdrop: (16 / 9),
    square: 1,
    banner: (1000 / 185)
};

/**
 * Computes the aspect ratio for a card given its shape.
 * @param {string} shape - Shape for which to get the aspect ratio.
 * @returns {null|number} Ratio of the shape.
 */
function getDesiredAspect(shape) {
    if (!shape) {
        return null;
    }

    shape = shape.toLowerCase();
    if (shape.indexOf('portrait') !== -1) {
        return ASPECT_RATIOS.portrait;
    }
    if (shape.indexOf('backdrop') !== -1) {
        return ASPECT_RATIOS.backdrop;
    }
    if (shape.indexOf('square') !== -1) {
        return ASPECT_RATIOS.square;
    }
    if (shape.indexOf('banner') !== -1) {
        return ASPECT_RATIOS.banner;
    }

    return null;
}

/**
 * Computes the number of posters per row.
 * @param {string} shape - Shape of the cards.
 * @param {number} screenWidth - Width of the screen.
 * @param {boolean} isOrientationLandscape - Flag for the orientation of the screen.
 * @param {boolean} isTV - Flag to denote if posters are rendered on a television screen.
 * @returns {number} Number of cards per row for an itemsContainer.
 */
function getPostersPerRow(shape, screenWidth, isOrientationLandscape, isTV) {
    switch (shape) {
        case 'portrait': return postersPerRowPortrait(screenWidth, isTV);
        case 'square': return postersPerRowSquare(screenWidth, isTV);
        case 'banner': return postersPerRowBanner(screenWidth);
        case 'backdrop': return postersPerRowBackdrop(screenWidth, isTV);
        case 'smallBackdrop': return postersPerRowSmallBackdrop(screenWidth);
        case 'overflowSmallBackdrop': return postersPerRowOverflowSmallBackdrop(screenWidth, isOrientationLandscape, isTV);
        case 'overflowPortrait': return postersPerRowOverflowPortrait(screenWidth, isOrientationLandscape, isTV);
        case 'overflowSquare': return postersPerRowOverflowSquare(screenWidth, isOrientationLandscape, isTV);
        case 'overflowBackdrop': return postersPerRowOverflowBackdrop(screenWidth, isOrientationLandscape, isTV);
        default: return 4;
    }
}

const postersPerRowPortrait = (screenWidth, isTV) => {
    switch (true) {
        case isTV: return 100 / 16.66666667;
        case screenWidth >= 2200: return 10;
        case screenWidth >= 1920: return 100 / 11.1111111111;
        case screenWidth >= 1600: return 8;
        case screenWidth >= 1400: return 100 / 14.28571428571;
        case screenWidth >= 1200: return 100 / 16.66666667;
        case screenWidth >= 800: return 5;
        case screenWidth >= 700: return 4;
        case screenWidth >= 500: return 100 / 33.33333333;
        default: return 100 / 33.33333333;
    }
};

const postersPerRowSquare = (screenWidth, isTV) => {
    switch (true) {
        case isTV: return 100 / 16.66666667;
        case screenWidth >= 2200: return 10;
        case screenWidth >= 1920: return 100 / 11.1111111111;
        case screenWidth >= 1600: return 8;
        case screenWidth >= 1400: return 100 / 14.28571428571;
        case screenWidth >= 1200: return 100 / 16.66666667;
        case screenWidth >= 800: return 5;
        case screenWidth >= 700: return 4;
        case screenWidth >= 500: return 100 / 33.33333333;
        default: return 2;
    }
};

const postersPerRowBanner = (screenWidth) => {
    switch (true) {
        case screenWidth >= 2200: return 4;
        case screenWidth >= 1200: return 100 / 33.33333333;
        case screenWidth >= 800: return 2;
        default: return 1;
    }
};

const postersPerRowBackdrop = (screenWidth, isTV) => {
    switch (true) {
        case isTV: return 4;
        case screenWidth >= 2500: return 6;
        case screenWidth >= 1600: return 5;
        case screenWidth >= 1200: return 4;
        case screenWidth >= 770: return 3;
        case screenWidth >= 420: return 2;
        default: return 1;
    }
};

function postersPerRowSmallBackdrop(screenWidth) {
    switch (true) {
        case screenWidth >= 1600: return 8;
        case screenWidth >= 1400: return 100 / 14.2857142857;
        case screenWidth >= 1200: return 100 / 16.66666667;
        case screenWidth >= 1000: return 5;
        case screenWidth >= 800: return 4;
        case screenWidth >= 500: return 100 / 33.33333333;
        default: return 2;
    }
}

const postersPerRowOverflowSmallBackdrop = (screenWidth, isLandscape, isTV) => {
    switch (true) {
        case isTV: return 100 / 18.9;
        case isLandscape && screenWidth >= 800: return 100 / 15.5;
        case isLandscape: return 100 / 23.3;
        case screenWidth >= 540: return 100 / 30;
        default: return 100 / 72;
    }
};

const postersPerRowOverflowPortrait = (screenWidth, isLandscape, isTV) => {
    switch (true) {
        case isTV: return 100 / 15.5;
        case isLandscape && screenWidth >= 1700: return 100 / 11.6;
        case isLandscape: return 100 / 15.5;
        case screenWidth >= 1400: return 100 / 15;
        case screenWidth >= 1200: return 100 / 18;
        case screenWidth >= 760: return 100 / 23;
        case screenWidth >= 400: return 100 / 31.5;
        default: return 100 / 42;
    }
};

const postersPerRowOverflowSquare = (screenWidth, isLandscape, isTV) => {
    switch (true) {
        case isTV: return 100 / 15.5;
        case isLandscape && screenWidth >= 1700: return 100 / 11.6;
        case isLandscape: return 100 / 15.5;
        case screenWidth >= 1400: return 100 / 15;
        case screenWidth >= 1200: return 100 / 18;
        case screenWidth >= 760: return 100 / 23;
        case screenWidth >= 540: return 100 / 31.5;
        default: return 100 / 42;
    }
};

const postersPerRowOverflowBackdrop = (screenWidth, isLandscape, isTV) => {
    switch (true) {
        case isTV: return 100 / 23.3;
        case isLandscape && screenWidth >= 1700: return 100 / 18.5;
        case isLandscape: return 100 / 23.3;
        case screenWidth >= 1800: return 100 / 23.5;
        case screenWidth >= 1400: return 100 / 30;
        case screenWidth >= 760: return 100 / 40;
        case screenWidth >= 640: return 100 / 56;
        default: return 100 / 72;
    }
};

export default {
    getDesiredAspect,
    getPostersPerRow
};
