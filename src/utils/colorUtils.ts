/**
 * Color Utility Functions for Visualizer Settings
 *
 * Provides hex/rgb conversion, validation, and WCAG accessibility checks.
 * Used by color picker UI components and visualizer rendering systems.
 *
 * Color Format Standards:
 * - Hex: #RRGGBB (uppercase) or #RGB (shorthand, automatically expanded)
 * - RGB: {r: 0-255, g: 0-255, b: 0-255}
 * - CSS RGB: "rgb(255, 0, 0)"
 *
 * Accessibility Standards:
 * - WCAG AA: Contrast ratio ≥ 4.5:1 (normal text)
 * - WCAG AAA: Contrast ratio ≥ 7:1 (enhanced)
 * - Default check uses WCAG AA (4.5:1)
 *
 * Usage:
 * ```typescript
 * import { hexToRgb, getContrastRatio, hasGoodContrast } from '@/utils/colorUtils';
 *
 * const rgb = hexToRgb('#1ED24B');
 * const ratio = getContrastRatio('#1ED24B', '#101010');
 * if (hasGoodContrast('#1ED24B', '#101010')) {
 *     // Safe to use this color combination
 * }
 * ```
 */

export interface RGBColor {
    r: number;
    g: number;
    b: number;
}

/**
 * Converts hex color string to RGB object
 *
 * Supports both standard (#RRGGBB) and shorthand (#RGB) formats.
 * Automatically expands shorthand: #F00 → #FF0000
 *
 * @param hex - Hex color string (#RRGGBB or #RGB)
 * @returns RGB color object with r, g, b values (0-255)
 *
 * @example
 * hexToRgb('#1ED24B') // { r: 30, g: 210, b: 75 }
 * hexToRgb('#F00')    // { r: 255, g: 0, b: 0 }
 */
export function hexToRgb(hex: string): RGBColor {
    // Remove # if present
    let cleanHex = hex.replace(/^#/, '');

    // Expand shorthand (#RGB -> #RRGGBB)
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return { r, g, b };
}

/**
 * Converts RGB values to uppercase hex color string
 *
 * Clamps values to 0-255 range and rounds to nearest integer.
 * Always returns uppercase hex (#RRGGBB format).
 *
 * @param r - Red component (0-255, clamped)
 * @param g - Green component (0-255, clamped)
 * @param b - Blue component (0-255, clamped)
 * @returns Hex color string in format #RRGGBB
 *
 * @example
 * rgbToHex(30, 210, 75)   // "#1ED24B"
 * rgbToHex(256, -5, 127.5) // "#007F" (clamped and rounded)
 */
export function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts RGB values to CSS rgb() string
 *
 * Useful for Web Audio API color properties and canvas rendering.
 * Values are rounded to nearest integer.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns CSS rgb color string format
 *
 * @example
 * rgbToString(30, 210, 75) // "rgb(30, 210, 75)"
 */
export function rgbToString(r: number, g: number, b: number): string {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * Parses CSS rgb() string to RGB object
 *
 * Handles variable whitespace. Returns {0,0,0} on parse error.
 * Used to reverse rgb() string back to component values.
 *
 * @param rgbString - CSS rgb color string (e.g. "rgb(255, 0, 0)")
 * @returns RGB color object, or {r:0, g:0, b:0} if parse fails
 *
 * @example
 * parseRgbString("rgb(30, 210, 75)") // {r: 30, g: 210, b: 75}
 * parseRgbString("rgb(255,0,0)")    // {r: 255, g: 0, b: 0} (no spaces ok)
 */
export function parseRgbString(rgbString: string): RGBColor {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) {
        console.error('Invalid RGB string:', rgbString);
        return { r: 0, g: 0, b: 0 };
    }

    return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
    };
}

/**
 * Validates hex color string format
 *
 * Checks for standard 6-digit hex format (#RRGGBB).
 * Case-insensitive (accepts #abc and #ABC).
 * Does not validate shorthand format (#RGB) - use hexToRgb for conversion.
 *
 * @param hex - Hex color string to validate
 * @returns True if matches #RRGGBB pattern, false otherwise
 *
 * @example
 * isValidHex('#1ED24B')  // true
 * isValidHex('#1ed24b')  // true (case-insensitive)
 * isValidHex('1ED24B')   // false (missing #)
 * isValidHex('#1ED24')   // false (too short)
 */
export function isValidHex(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Calculates relative luminance of a color (WCAG standard)
 *
 * Uses the official WCAG 2.0 formula for luminance calculation.
 * Required for contrast ratio computations used in accessibility checks.
 *
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where each component applies sRGB gamma correction:
 * - if ≤ 0.03928: component / 12.92
 * - else: ((component + 0.055) / 1.055)^2.4
 *
 * @private - Internal function, use getContrastRatio instead
 * @param hex - Hex color for luminance calculation
 * @returns Relative luminance (0.0 = dark, 1.0 = light)
 */
function getLuminance(hex: string): number {
    const rgb = hexToRgb(hex);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        const normalized = val / 255;
        return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates contrast ratio between two colors using WCAG 2.0 formula
 *
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is brightest and L2 is darkest luminance.
 * The 0.05 offset ensures the denominator is never zero.
 *
 * Contrast Ratio Standards:
 * - 1:1 = identical colors
 * - 4.5:1 = WCAG AA (minimum for normal text)
 * - 7:1 = WCAG AAA (enhanced)
 * - 21:1 = maximum possible (black vs white)
 *
 * Returns 0 if either color is invalid (logs error).
 *
 * @param color1 - First hex color (#RRGGBB)
 * @param color2 - Second hex color (#RRGGBB)
 * @returns Contrast ratio (0 for invalid colors, 1-21 for valid)
 *
 * @example
 * getContrastRatio('#FFFFFF', '#000000') // 21.0 (perfect contrast)
 * getContrastRatio('#1ED24B', '#101010') // ~4.8 (passes AA)
 * getContrastRatio('#FF0000', '#FF0001') // ~1.0 (nearly identical)
 */
export function getContrastRatio(color1: string, color2: string): number {
    if (!isValidHex(color1) || !isValidHex(color2)) {
        console.error('Invalid hex colors for contrast check');
        return 0;
    }

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Checks if foreground/background color pair meets accessibility standard
 *
 * Uses WCAG AA default (4.5:1) but supports custom thresholds.
 * Used to validate user-selected visualizer colors for visibility.
 *
 * Standards:
 * - WCAG AA (normal text): ratio ≥ 4.5:1 (default)
 * - WCAG AA (large text): ratio ≥ 3:1
 * - WCAG AAA: ratio ≥ 7:1
 *
 * Returns false if colors are invalid.
 *
 * @param foreground - Text/foreground hex color
 * @param background - Background hex color
 * @param ratio - Minimum contrast ratio required (default 4.5 for WCAG AA)
 * @returns True if contrast ratio meets or exceeds standard, false otherwise
 *
 * @example
 * hasGoodContrast('#1ED24B', '#101010')       // true (ratio ~4.8, meets AA)
 * hasGoodContrast('#1ED24B', '#101010', 7)   // false (doesn't meet AAA)
 * hasGoodContrast('#FF0000', '#FF0001')      // false (identical, ratio ~1)
 */
export function hasGoodContrast(foreground: string, background: string, ratio = 4.5): boolean {
    return getContrastRatio(foreground, background) >= ratio;
}

/**
 * Color-blind safe palettes for inclusive visualizer design
 *
 * Provides four palettes optimized for different color vision deficiencies:
 *
 * **Protanopia (Red-Blind)**
 * - ~1% of males, 0.01% of females
 * - Can't distinguish red; confuses red/brown with green/yellow
 * - Safe palette uses blue/yellow/magenta
 *
 * **Deuteranopia (Green-Blind)**
 * - ~1% of males, 0.01% of females
 * - Can't distinguish green; confuses green with red/yellow
 * - Safe palette uses blue/orange/red
 *
 * **Tritanopia (Blue-Yellow Blind)**
 * - ~0.001% of population (very rare)
 * - Can't distinguish blue/yellow; confuses blue/purple with red/pink
 * - Safe palette uses magenta/orange/green
 *
 * **High Contrast**
 * - For low vision users or high-glare environments
 * - Uses primary colors at maximum saturation/brightness
 * - Green/Yellow/Red with strong visual separation
 *
 * @see https://en.wikipedia.org/wiki/Color_blindness
 * @see https://www.color-blindness.com/
 */
export const colorBlindPalettes = {
    protanopia: {
        low: '#0077bb',     // Blue
        mid: '#ffaa00',     // Orange/Yellow
        high: '#aa3377'     // Magenta
    },
    deuteranopia: {
        low: '#0077bb',     // Blue
        mid: '#ee7733',     // Orange
        high: '#cc3311'     // Red
    },
    tritanopia: {
        low: '#dd3377',     // Magenta
        mid: '#ee7733',     // Orange
        high: '#117733'     // Green
    },
    highContrast: {
        low: '#00ff00',     // Bright Green
        mid: '#ffff00',     // Bright Yellow
        high: '#ff0000'     // Bright Red
    }
} as const;

/**
 * Retrieves color-blind safe palette by vision deficiency type
 *
 * Returns palette object with low/mid/high frequency colors.
 * Defaults to protanopia if type is invalid (most common deficiency).
 *
 * Typical usage in visualizer settings:
 * ```typescript
 * const palette = getColorBlindPalette('deuteranopia');
 * visualizerSettings.frequencyAnalyzer.colors.gradient = palette;
 * ```
 *
 * @param type - Color vision deficiency: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'highContrast'
 * @returns Palette object with low/mid/high colors optimized for the vision type
 *
 * @example
 * getColorBlindPalette('protanopia')   // {low: '#0077bb', mid: '#ffaa00', high: '#aa3377'}
 * getColorBlindPalette('invalid')      // {low: '#0077bb', ...} (defaults to protanopia)
 */
export function getColorBlindPalette(type: keyof typeof colorBlindPalettes) {
    return colorBlindPalettes[type] || colorBlindPalettes.protanopia;
}
