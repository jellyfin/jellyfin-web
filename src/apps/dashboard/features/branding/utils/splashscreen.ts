/**
 * Image types the server can decode for the splashscreen. Anything else is
 * rejected before upload so the user gets a clear message instead of a failed
 * request.
 */
export const SUPPORTED_SPLASHSCREEN_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/bmp'
];

/** Value for the file input's accept attribute. */
export const SPLASHSCREEN_ACCEPT = SUPPORTED_SPLASHSCREEN_TYPES.join(',');

/** Whether a file is an image type the splashscreen upload supports. */
export const isSupportedSplashscreenFile = (file: Pick<File, 'type'>) => (
    SUPPORTED_SPLASHSCREEN_TYPES.includes(file.type.toLowerCase())
);
