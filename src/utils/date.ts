/** Converts a Date object to an ISO date string (YYYY-MM-DD). */
export const toIsoDateOnlyString = (date: Date) => {
    return date.toISOString().split('T')[0];
};
