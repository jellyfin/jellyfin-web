import datetime from 'scripts/datetime';

export const safeParseDate = (dateString?: string | null, toLocal = true): Date | null => {
    try {
        return dateString ? datetime.parseISO8601Date(dateString, toLocal) : null;
    } catch {
        console.warn('Invalid date format:', dateString);
        return null;
    }
};
