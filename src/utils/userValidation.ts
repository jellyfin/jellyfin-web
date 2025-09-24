/**
 * Utility functions for user validation
 */

/**
 * Validates if a username contains only allowed characters
 * According to Jellyfin server: unicode symbols, numbers (0-9), dashes (-), underscores (_), apostrophes ('), and periods (.)
 */
export const isValidUsername = (username: string): boolean => {
    if (!username || username.trim().length === 0) {
        return false;
    }

    // Regex pattern for allowed characters: letters, numbers, dashes, underscores, apostrophes, periods
    // Using a more compatible approach for older JS targets
    const allowedPattern = /^[a-zA-Z0-9\u00C0-\u017F\u0400-\u04FF\u4e00-\u9fff\-_'.]+$/;
    return allowedPattern.test(username.trim());
};

/**
 * Gets a user-friendly error message for invalid usernames
 */
export const getUsernameValidationMessage = (): string => {
    return 'Username contains invalid characters. Only letters, numbers, dashes (-), underscores (_), apostrophes (\'), and periods (.) are allowed.';
};

/**
 * Extracts error message from API error response
 */
export const extractApiErrorMessage = (error: any): string => {
    // Try to extract specific error message from various possible error formats
    if (error?.message) {
        return error.message;
    }
    
    if (error?.responseText) {
        try {
            const parsed = JSON.parse(error.responseText);
            if (parsed?.message) {
                return parsed.message;
            }
        } catch {
            // If parsing fails, return the raw response text
            return error.responseText;
        }
    }
    
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }
    
    if (typeof error === 'string') {
        return error;
    }
    
    return 'An unexpected error occurred. Please try again.';
};
