/**
 * Utility functions for user validation
 */

/**
 * Validates if a username contains only allowed characters
 * According to Jellyfin server: unicode symbols, numbers (0-9), dashes (-), underscores (_), apostrophes ('), and periods (.)
 */
export const isValidUsername = (username: string): boolean => {
    if (!username || typeof username !== 'string') {
        return false;
    }

    const trimmedUsername = username.trim();

    // Check length constraints (1-255 characters is typical for usernames)
    if (trimmedUsername.length === 0 || trimmedUsername.length > 255) {
        return false;
    }

    // Regex pattern for allowed characters: letters, numbers, dashes, underscores, apostrophes, periods
    // Using non-overlapping character ranges compatible with older JS targets
    const allowedPattern = /^[a-zA-Z0-9\u00C0-\u024F\u0400-\u04FF\u4e00-\u9fff\u1E00-\u1EFF_'.-]+$/;
    return allowedPattern.test(trimmedUsername);
};

/**
 * Gets a user-friendly error message for invalid usernames
 */
export const getUsernameValidationMessage = (): string => {
    return 'Username contains invalid characters. Only letters, numbers, dashes (-), underscores (_), apostrophes (\'), and periods (.) are allowed.';
};

/**
 * Type definitions for different error formats that can be received from APIs
 */
type ApiError = {
    message?: string;
    responseText?: string;
    status?: number;
    response?: {
        status?: number;
        data?: {
            message?: string;
        };
    };
} | string | null | undefined;

/**
 * Helper function to get HTTP status error message
 */
const getHttpStatusMessage = (status: number): string => {
    switch (status) {
        case 400:
            return 'Bad request. Please check your input and try again.';
        case 401:
            return 'Authentication required. Please log in and try again.';
        case 403:
            return 'Access denied. You do not have permission to perform this action.';
        case 404:
            return 'The requested resource was not found.';
        case 500:
            return 'Internal server error. Please try again later.';
        default:
            return `Server error (${status}). Please try again later.`;
    }
};

/**
 * Helper function to extract message from responseText
 */
const extractFromResponseText = (responseText: string): string | null => {
    try {
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed === 'object' && parsed.message && typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
            return parsed.message.trim();
        }
    } catch {
        // If parsing fails, return the raw response text if it's meaningful
        const trimmedText = responseText.trim();
        if (trimmedText.length > 0 && trimmedText.length < 500) {
            return trimmedText;
        }
    }
    return null;
};

/**
 * Helper function to extract message from error object properties
 */
const extractFromErrorObject = (error: Exclude<ApiError, string | null | undefined>): string | null => {
    // Try direct message property
    if (error.message && typeof error.message === 'string' && error.message.trim().length > 0) {
        return error.message.trim();
    }

    // Try responseText
    if (error.responseText && typeof error.responseText === 'string' && error.responseText.trim().length > 0) {
        const result = extractFromResponseText(error.responseText);
        if (result) return result;
    }

    // Try nested response data message
    if (error.response?.data?.message && typeof error.response.data.message === 'string' && error.response.data.message.trim().length > 0) {
        return error.response.data.message.trim();
    }

    // Try HTTP status codes
    if (error.status || error.response?.status) {
        const status = error.status || error.response?.status;
        if (typeof status === 'number') {
            return getHttpStatusMessage(status);
        }
    }

    return null;
};

/**
 * Extracts error message from API error response
 */
export const extractApiErrorMessage = (error: ApiError): string => {
    const defaultMessage = 'An unexpected error occurred. Please try again.';

    // Handle null/undefined errors
    if (!error) {
        return defaultMessage;
    }

    // Handle string errors
    if (typeof error === 'string') {
        const trimmed = error.trim();
        return trimmed.length > 0 ? trimmed : defaultMessage;
    }

    // Handle object errors
    const result = extractFromErrorObject(error);
    return result || defaultMessage;
};
