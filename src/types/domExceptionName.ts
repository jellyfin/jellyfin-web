/**
 * Standardized DOMException name strings.
 *
 * Use these instead of the deprecated numeric DOMException codes
 * (e.g. DOMException.NOT_FOUND_ERR) when matching against
 * DOMException.name.
 *
 * @see https://developer.mozilla.org/docs/Web/API/DOMException#error_names
 */
export enum DOMExceptionName {
    AbortError = 'AbortError',
    EncodingError = 'EncodingError',
    NotFoundError = 'NotFoundError',
    NotReadableError = 'NotReadableError',
    NotSupportedError = 'NotSupportedError',
    SecurityError = 'SecurityError'
}
