interface TextBackground {
    hex: string;
    opacity: number;
}

const RGBA_PATTERN = /^rgba\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3}), ?([\d.]+)\)$/;

const DEFAULT_TEXT_BACKGROUND: TextBackground = { hex: '#000000', opacity: 0 };

function channelToHex(channel: string): string {
    return Math.min(Number(channel), 255).toString(16).padStart(2, '0');
}

/**
 * Converts hex color and opacity to rgba color.
 * @param hex - The color in #rrggbb format.
 * @param opacity - The opacity from 0 to 100.
 * @returns The color as rgba string.
 */
export function hexToRgba(hex: string, opacity: number): string {
    const red = Number.parseInt(hex.slice(1, 3), 16);
    const green = Number.parseInt(hex.slice(3, 5), 16);
    const blue = Number.parseInt(hex.slice(5, 7), 16);
    const alpha = Math.min(Math.max(opacity, 0), 100) / 100;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * Parse a stored text background value into hex color and opacity.
 * Values that cannot be parsed (including legacy "transparent") will now fall back to transparent bg.
 * @param value - The stored text background value.
 * @returns An object containing the hex color and opacity.
 */
export function parseTextBackground(value?: string): TextBackground {
    const match = RGBA_PATTERN.exec(value ?? '');
    if (!match) return { ...DEFAULT_TEXT_BACKGROUND };

    const [ , red, green, blue, alpha ] = match;
    const fraction = Number(alpha);
    if (!Number.isFinite(fraction)) return { ...DEFAULT_TEXT_BACKGROUND };

    return {
        hex: `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`,
        opacity: Math.round(Math.min(fraction, 1) * 100)
    };
}
