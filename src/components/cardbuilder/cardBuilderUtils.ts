import classNames from 'classnames';

import { ItemAction } from 'constants/itemAction';
import { CardShape } from 'utils/card';
import { randomInt } from 'utils/number';

const ASPECT_RATIOS = {
    portrait: (2 / 3),
    backdrop: (16 / 9),
    square: 1,
    banner: (1000 / 185)
};

/**
 * Determines if the item is live TV.
 * @param {string | null | undefined} itemType - Item type to use for the check.
 * @returns {boolean} Flag showing if the item is live TV.
 */
export const isUsingLiveTvNaming = (itemType: string | null | undefined): boolean => itemType === 'Program' || itemType === 'Timer' || itemType === 'Recording';

/**
 * Resolves Card action to display
 * @param opts options to determine the action to return
 */
export const resolveAction = (opts: { defaultAction: ItemAction, isFolder: boolean, isPhoto: boolean }): ItemAction => {
    if (opts.defaultAction === ItemAction.Play && opts.isFolder) {
        // If this hard-coding is ever removed make sure to test nested photo albums
        return ItemAction.Link;
    } else if (opts.isPhoto) {
        return ItemAction.Play;
    } else {
        return opts.defaultAction;
    }
};

/**
 * Checks if the window is resizable.
 * @param {number} windowWidth - Width of the device's screen.
 * @returns {boolean} - Result of the check.
 */
export const isResizable = (windowWidth: number): boolean => {
    const screen = window.screen;
    if (screen) {
        const screenWidth = screen.availWidth;

        if ((screenWidth - windowWidth) > 20) {
            return true;
        }
    }

    return false;
};

/**
 * Resolves mixed shape based on aspect ratio
 * @param primaryImageAspectRatio image aspect ratio that determines mixed shape
 */
export const resolveMixedShapeByAspectRatio = (primaryImageAspectRatio: number | null | undefined) => {
    if (primaryImageAspectRatio === undefined || primaryImageAspectRatio === null) {
        return CardShape.MixedSquare;
    }

    if (primaryImageAspectRatio >= 1.33) {
        return CardShape.MixedBackdrop;
    } else if (primaryImageAspectRatio > 0.8) {
        return CardShape.MixedSquare;
    } else {
        return CardShape.MixedPortrait;
    }
};

type CardCssClassOpts = {
    shape?: string,
    cardCssClass?: string,
    cardClass?: string,
    tagName?: string,
    itemType: string,
    childCount?: number,
    showChildCountIndicator: boolean,
    isTV: boolean,
    enableFocusTransform: boolean,
    isDesktop: boolean,
    isMultiselectable?: boolean,
};

/**
 * Resolves applicable Card CSS classes
 * @param opts options for determining which CSS classes are applicable
 */
export const resolveCardCssClasses = (opts: CardCssClassOpts): string => {
    return classNames({
        'card': true,
        [`${opts.shape}Card`]: opts.shape,
        [`${opts.cardCssClass}`]: opts.cardCssClass,
        [`${opts.cardClass}`]: opts.cardClass,
        'card-hoverable': opts.isDesktop,
        'show-focus': opts.isTV,
        'show-animation': opts.isTV && opts.enableFocusTransform,
        'groupedCard': opts.showChildCountIndicator && opts.childCount,
        'card-withuserdata': !['MusicAlbum', 'MusicArtist', 'Audio'].includes(opts.itemType),
        'itemAction': opts.tagName === 'button',
        'multiselectable': opts.isMultiselectable || false,
    });
};

/**
 * Resolves applicable Card Image container CSS classes
 * @param opts options for determining which CSS classes are applicable
 */
export const resolveCardImageContainerCssClasses = (opts: { itemType: string, hasCoverImage: boolean, itemName?: string, imgUrl?: string }): string => {
    return classNames({
        'cardImageContainer': true,
        'coveredImage': opts.hasCoverImage,
        'coveredImage-contain': opts.hasCoverImage && opts.itemType === 'TvChannel',
        [getDefaultBackgroundClass(opts.itemName)]: !opts.imgUrl
    });
};

/**
 * Resolves applicable Card Box CSS classes
 * @param opts options for determining which CSS classes are applicable
 */
export const resolveCardBoxCssClasses = (opts: { cardLayout: boolean, hasOuterCardFooter: boolean }): string => {
    return classNames({
        'cardBox': true,
        'visualCardBox': opts.cardLayout,
        'cardBox-bottompadded': opts.hasOuterCardFooter && !opts.cardLayout,
        'multiselect-container': true,
    });
};

/**
 * Returns the default background class for a card based on a string.
 * @param {?string} [str] - Text used to generate the background class.
 * @returns {string} CSS classes for default card backgrounds.
 */
export const getDefaultBackgroundClass = (str?: string | null): string => `defaultCardBackground defaultCardBackground${getDefaultColorIndex(str)}`;

/**
 * Generates an index used to select the default color of a card based on a string.
 * @param {?string} [str] - String to use for generating the index.
 * @returns {number} Index of the color.
 */
export const getDefaultColorIndex = (str?: string | null): number => {
    const numRandomColors = 5;

    if (str) {
        const charIndex = Math.floor(str.length / 2);
        const character = String(str.slice(charIndex, charIndex + 1).charCodeAt(0));
        let sum = 0;
        for (let i = 0; i < character.length; i++) {
            sum += parseInt(character.charAt(i), 10);
        }
        const index = parseInt(String(sum).slice(-1), 10);

        return (index % numRandomColors) + 1;
    } else {
        return randomInt(1, numRandomColors);
    }
};

/**
 * Computes the aspect ratio for a card given its shape.
 * @param {string} shape - Shape for which to get the aspect ratio.
 * @returns {null|number} Ratio of the shape.
 */
export const getDesiredAspect = (shape: string | null | undefined): null | number => {
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
};

/**
 * Computes the number of posters per row.
 * @param {string} shape - Shape of the cards.
 * @param {number} screenWidth - Width of the screen.
 * @param {boolean} isOrientationLandscape - Flag for the orientation of the screen.
 * @param {boolean} isTV - Flag to denote if posters are rendered on a television screen.
 * @returns {number} Number of cards per row for an itemsContainer.
 */
export const getPostersPerRow = (shape: string, screenWidth: number, isOrientationLandscape: boolean, isTV: boolean): number => {
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
};

const postersPerRowPortrait = (screenWidth: number, isTV: boolean) => {
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

const postersPerRowSquare = (screenWidth: number, isTV: boolean) => {
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

const postersPerRowBanner = (screenWidth: number) => {
    switch (true) {
        case screenWidth >= 2200: return 4;
        case screenWidth >= 1200: return 100 / 33.33333333;
        case screenWidth >= 800: return 2;
        default: return 1;
    }
};

const postersPerRowBackdrop = (screenWidth: number, isTV: boolean) => {
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

const postersPerRowSmallBackdrop = (screenWidth: number) => {
    switch (true) {
        case screenWidth >= 1600: return 8;
        case screenWidth >= 1400: return 100 / 14.2857142857;
        case screenWidth >= 1200: return 100 / 16.66666667;
        case screenWidth >= 1000: return 5;
        case screenWidth >= 800: return 4;
        case screenWidth >= 500: return 100 / 33.33333333;
        default: return 2;
    }
};

const postersPerRowOverflowSmallBackdrop = (screenWidth: number, isLandscape: boolean, isTV: boolean) => {
    switch (true) {
        case isTV: return 100 / 18.9;
        case isLandscape && screenWidth >= 800: return 100 / 15.5;
        case isLandscape: return 100 / 23.3;
        case screenWidth >= 540: return 100 / 30;
        default: return 100 / 72;
    }
};

const postersPerRowOverflowPortrait = (screenWidth: number, isLandscape: boolean, isTV: boolean) => {
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

const postersPerRowOverflowSquare = (screenWidth: number, isLandscape: boolean, isTV: boolean) => {
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

const postersPerRowOverflowBackdrop = (screenWidth: number, isLandscape: boolean, isTV: boolean) => {
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
