/** The fields of an error that are safe to log. */
export interface LoggableError {
    name?: string
    message?: string
    code?: string
    status?: number
}

const getString = (value: unknown) => (typeof value === 'string' ? value : undefined);

/**
 * Reduces an error to fields that are safe to log. Request errors include the request config and body,
 * which can contain passwords, quick connect secrets or access tokens, so only allowlisted fields are kept.
 */
export const toLoggableError = (error: unknown): LoggableError => {
    if (typeof error !== 'object' || error === null) {
        return { message: getString(error) };
    }

    const { name, message, code, response } = error as Record<string, unknown>;
    const status = typeof response === 'object' && response !== null ?
        (response as Record<string, unknown>).status :
        undefined;

    return {
        name: getString(name),
        message: getString(message),
        code: getString(code),
        status: typeof status === 'number' ? status : undefined
    };
};
