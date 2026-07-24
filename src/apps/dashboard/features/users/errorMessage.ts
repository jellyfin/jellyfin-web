function getErrorString(value: unknown, depth = 0): string | undefined {
    if (depth > 3 || value == null) {
        return undefined;
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        return trimmedValue || undefined;
    }

    if (value instanceof Error) {
        return getErrorString(value.message, depth + 1);
    }

    if (typeof value === 'object') {
        const record = value as Record<string, unknown>;

        return getErrorString(record.message, depth + 1)
            ?? getErrorString(record.Message, depth + 1)
            ?? getErrorString(record.title, depth + 1)
            ?? getErrorString(record.Title, depth + 1)
            ?? getErrorString(record.error, depth + 1)
            ?? getErrorString(record.Error, depth + 1)
            ?? getErrorString(record.data, depth + 1)
            ?? getErrorString(record.response, depth + 1);
    }

    return undefined;
}

export function getMutationErrorMessage(error: unknown): string | undefined {
    return getErrorString(error);
}
