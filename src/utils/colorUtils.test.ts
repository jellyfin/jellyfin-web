/**
 * Color Utilities Test Suite
 * Tests hex/rgb conversion, validation, and WCAG accessibility checks
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    getColorBlindPalette,
    getContrastRatio,
    hasGoodContrast,
    hexToRgb,
    isValidHex,
    parseRgbString,
    rgbToHex,
    rgbToString
} from './colorUtils';

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('colorUtils - Color Conversion', () => {
    describe('hexToRgb', () => {
        it('should convert standard hex format to RGB', () => {
            const result = hexToRgb('#1ED24B');
            expect(result).toEqual({ r: 30, g: 210, b: 75 });
        });

        it('should convert uppercase hex to RGB', () => {
            const result = hexToRgb('#FFFFFF');
            expect(result).toEqual({ r: 255, g: 255, b: 255 });
        });

        it('should convert lowercase hex to RGB', () => {
            const result = hexToRgb('#000000');
            expect(result).toEqual({ r: 0, g: 0, b: 0 });
        });

        it('should expand shorthand hex format', () => {
            const result = hexToRgb('#F00');
            expect(result).toEqual({ r: 255, g: 0, b: 0 });
        });

        it('should handle hex without leading #', () => {
            const result = hexToRgb('1ED24B');
            expect(result).toEqual({ r: 30, g: 210, b: 75 });
        });

        it('should handle all color channels independently', () => {
            const result = hexToRgb('#FFD700');
            expect(result).toEqual({ r: 255, g: 215, b: 0 });
        });
    });

    describe('rgbToHex', () => {
        it('should convert RGB to uppercase hex', () => {
            const result = rgbToHex(30, 210, 75);
            expect(result).toBe('#1ED24B');
        });

        it('should convert pure white to hex', () => {
            const result = rgbToHex(255, 255, 255);
            expect(result).toBe('#FFFFFF');
        });

        it('should convert pure black to hex', () => {
            const result = rgbToHex(0, 0, 0);
            expect(result).toBe('#000000');
        });

        it('should clamp values above 255', () => {
            const result = rgbToHex(300, 256, 260);
            expect(result).toBe('#FFFFFF');
        });

        it('should clamp negative values to 0', () => {
            const result = rgbToHex(-10, -5, -1);
            expect(result).toBe('#000000');
        });

        it('should round decimal values', () => {
            const result = rgbToHex(30.4, 210.4, 75.1);
            expect(result).toBe('#1ED24B');
        });

        it('should pad single-digit hex values', () => {
            const result = rgbToHex(15, 15, 15);
            expect(result).toBe('#0F0F0F');
        });
    });

    describe('rgbToString', () => {
        it('should convert RGB to CSS rgb() string', () => {
            const result = rgbToString(30, 210, 75);
            expect(result).toBe('rgb(30, 210, 75)');
        });

        it('should handle maximum values', () => {
            const result = rgbToString(255, 255, 255);
            expect(result).toBe('rgb(255, 255, 255)');
        });

        it('should handle minimum values', () => {
            const result = rgbToString(0, 0, 0);
            expect(result).toBe('rgb(0, 0, 0)');
        });

        it('should round decimal values', () => {
            const result = rgbToString(30.4, 210.6, 75.1);
            expect(result).toBe('rgb(30, 211, 75)');
        });
    });

    describe('parseRgbString', () => {
        it('should parse CSS rgb() string to RGB object', () => {
            const result = parseRgbString('rgb(30, 210, 75)');
            expect(result).toEqual({ r: 30, g: 210, b: 75 });
        });

        it('should handle variable whitespace', () => {
            const result = parseRgbString('rgb(255,0,0)');
            expect(result).toEqual({ r: 255, g: 0, b: 0 });
        });

        it('should handle single space after comma', () => {
            const result = parseRgbString('rgb(255, 0, 0)');
            expect(result).toEqual({ r: 255, g: 0, b: 0 });
        });

        it('should return zeros on invalid format', () => {
            const result = parseRgbString('invalid');
            expect(result).toEqual({ r: 0, g: 0, b: 0 });
        });

        it('should handle edge case values', () => {
            const result = parseRgbString('rgb(0, 128, 255)');
            expect(result).toEqual({ r: 0, g: 128, b: 255 });
        });
    });
});

describe('colorUtils - Validation', () => {
    describe('isValidHex', () => {
        it('should validate standard hex format', () => {
            expect(isValidHex('#1ED24B')).toBe(true);
            expect(isValidHex('#FFFFFF')).toBe(true);
            expect(isValidHex('#000000')).toBe(true);
        });

        it('should accept lowercase hex', () => {
            expect(isValidHex('#ffffff')).toBe(true);
            expect(isValidHex('#1ed24b')).toBe(true);
        });

        it('should accept mixed case hex', () => {
            expect(isValidHex('#1Ed24b')).toBe(true);
        });

        it('should reject hex without #', () => {
            expect(isValidHex('1ED24B')).toBe(false);
        });

        it('should reject shorthand hex', () => {
            expect(isValidHex('#F00')).toBe(false);
        });

        it('should reject invalid characters', () => {
            expect(isValidHex('#GGGGGG')).toBe(false);
            expect(isValidHex('#12345G')).toBe(false);
        });

        it('should reject too short hex', () => {
            expect(isValidHex('#12345')).toBe(false);
        });

        it('should reject too long hex', () => {
            expect(isValidHex('#1234567')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(isValidHex('')).toBe(false);
        });
    });
});

describe('colorUtils - WCAG Accessibility', () => {
    describe('getContrastRatio', () => {
        it('should calculate perfect contrast (white vs black)', () => {
            const ratio = getContrastRatio('#FFFFFF', '#000000');
            expect(ratio).toBeCloseTo(21.0, 0);
        });

        it('should calculate contrast for green vs dark bg', () => {
            const ratio = getContrastRatio('#1ED24B', '#101010');
            expect(ratio).toBeGreaterThan(9.0);
            expect(ratio).toBeLessThan(10.0);
        });

        it('should calculate contrast for identical colors', () => {
            const ratio = getContrastRatio('#FF0000', '#FF0000');
            expect(ratio).toBe(1);
        });

        it('should calculate contrast for similar colors', () => {
            const ratio = getContrastRatio('#FF0000', '#FF0001');
            expect(ratio).toBeLessThan(1.1);
        });

        it('should be symmetric (order should not matter)', () => {
            const ratio1 = getContrastRatio('#FFFFFF', '#000000');
            const ratio2 = getContrastRatio('#000000', '#FFFFFF');
            expect(ratio1).toBe(ratio2);
        });

        it('should return 0 for invalid color1', () => {
            const ratio = getContrastRatio('#GGGGGG', '#000000');
            expect(ratio).toBe(0);
        });

        it('should return 0 for invalid color2', () => {
            const ratio = getContrastRatio('#FFFFFF', '#invalid');
            expect(ratio).toBe(0);
        });

        it('should handle various valid color pairs', () => {
            const pairs = [
                ['#FFD700', '#101010'], // Gold vs dark
                ['#FF3232', '#FFFFFF'], // Red vs white
                ['#1ED24B', '#202020'] // Green vs dark gray
            ];

            pairs.forEach(([color1, color2]) => {
                const ratio = getContrastRatio(color1, color2);
                expect(ratio).toBeGreaterThan(0);
                expect(ratio).toBeLessThanOrEqual(21);
            });
        });
    });

    describe('hasGoodContrast', () => {
        it('should pass WCAG AA for good contrast colors', () => {
            expect(hasGoodContrast('#1ED24B', '#101010')).toBe(true);
        });

        it('should fail WCAG AA for poor contrast colors', () => {
            expect(hasGoodContrast('#FF0000', '#FF0001')).toBe(false);
        });

        it('should pass with perfect contrast', () => {
            expect(hasGoodContrast('#FFFFFF', '#000000')).toBe(true);
        });

        it('should use default WCAG AA (4.5:1) threshold', () => {
            expect(hasGoodContrast('#1ED24B', '#101010')).toBe(true);
        });

        it('should accept custom ratio threshold', () => {
            expect(hasGoodContrast('#1ED24B', '#101010', 10)).toBe(false); // Custom high threshold
            expect(hasGoodContrast('#1ED24B', '#101010', 7)).toBe(true); // Passes AAA
        });

        it('should fail for identical colors with high threshold', () => {
            expect(hasGoodContrast('#FF0000', '#FF0000', 1.1)).toBe(false);
        });

        it('should handle invalid colors gracefully', () => {
            expect(hasGoodContrast('#INVALID', '#000000')).toBe(false);
        });

        it('should pass for multiple valid color combinations', () => {
            const combinations = [
                ['#FFFFFF', '#000000'],
                ['#1ED24B', '#101010'],
                ['#FFD700', '#202020']
            ];

            combinations.forEach(([fg, bg]) => {
                expect(hasGoodContrast(fg, bg)).toBe(true);
            });
        });
    });
});

describe('colorUtils - Color-Blind Palettes', () => {
    describe('getColorBlindPalette', () => {
        it('should return protanopia palette', () => {
            const palette = getColorBlindPalette('protanopia');
            expect(palette).toHaveProperty('low');
            expect(palette).toHaveProperty('mid');
            expect(palette).toHaveProperty('high');
            expect(isValidHex(palette.low)).toBe(true);
            expect(isValidHex(palette.mid)).toBe(true);
            expect(isValidHex(palette.high)).toBe(true);
        });

        it('should return deuteranopia palette', () => {
            const palette = getColorBlindPalette('deuteranopia');
            expect(palette).toHaveProperty('low', '#0077bb');
            expect(palette).toHaveProperty('mid', '#ee7733');
            expect(palette).toHaveProperty('high', '#cc3311');
        });

        it('should return tritanopia palette', () => {
            const palette = getColorBlindPalette('tritanopia');
            expect(palette).toHaveProperty('low');
            expect(palette).toHaveProperty('mid');
            expect(palette).toHaveProperty('high');
        });

        it('should return high contrast palette', () => {
            const palette = getColorBlindPalette('highContrast');
            expect(palette).toHaveProperty('low', '#00ff00');
            expect(palette).toHaveProperty('mid', '#ffff00');
            expect(palette).toHaveProperty('high', '#ff0000');
        });

        it('should default to protanopia for invalid type', () => {
            const palette = getColorBlindPalette('invalid' as any);
            expect(palette).toEqual(getColorBlindPalette('protanopia'));
        });

        it('should return different palettes for different types', () => {
            const protanopia = getColorBlindPalette('protanopia');
            const deuteranopia = getColorBlindPalette('deuteranopia');
            const tritanopia = getColorBlindPalette('tritanopia');

            expect(protanopia).not.toEqual(deuteranopia);
            expect(deuteranopia).not.toEqual(tritanopia);
        });

        it('should provide high contrast palette with maximum saturation', () => {
            const highContrast = getColorBlindPalette('highContrast');
            expect(highContrast.low).toBe('#00ff00'); // Pure green
            expect(highContrast.mid).toBe('#ffff00'); // Pure yellow
            expect(highContrast.high).toBe('#ff0000'); // Pure red
        });
    });
});

describe('colorUtils - Integration Tests', () => {
    it('should convert hex → rgb → hex round-trip', () => {
        const originalHex = '#1ED24B';
        const rgb = hexToRgb(originalHex);
        const roundTripHex = rgbToHex(rgb.r, rgb.g, rgb.b);
        expect(roundTripHex).toBe(originalHex);
    });

    it('should convert hex → rgb → string → parse round-trip', () => {
        const originalHex = '#FFFFFF';
        const rgb = hexToRgb(originalHex);
        const rgbString = rgbToString(rgb.r, rgb.g, rgb.b);
        const parsed = parseRgbString(rgbString);
        expect(parsed.r).toBe(rgb.r);
        expect(parsed.g).toBe(rgb.g);
        expect(parsed.b).toBe(rgb.b);
    });

    it('should validate all colors in color-blind palettes', () => {
        const palettes = ['protanopia', 'deuteranopia', 'tritanopia', 'highContrast'] as const;

        palettes.forEach((paletteType) => {
            const palette = getColorBlindPalette(paletteType);
            expect(isValidHex(palette.low)).toBe(true);
            expect(isValidHex(palette.mid)).toBe(true);
            expect(isValidHex(palette.high)).toBe(true);
        });
    });

    it('should ensure high contrast palette colors have good contrast', () => {
        const highContrast = getColorBlindPalette('highContrast');
        const backgroundColor = '#101010'; // Jellyfin dark background

        expect(hasGoodContrast(highContrast.low, backgroundColor)).toBe(true);
        expect(hasGoodContrast(highContrast.mid, backgroundColor)).toBe(true);
        expect(hasGoodContrast(highContrast.high, backgroundColor)).toBe(true);
    });
});
