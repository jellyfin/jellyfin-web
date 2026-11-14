/** The fixed queue limit used before it became configurable. */
const LEGACY_QUEUE_LIMIT = 300;

/**
 * Resolves the limit for a playback items query.
 * An explicit limit always wins. Otherwise the user's maximum queue size applies, except that
 * id lists are never cut below the legacy limit, since callers index into them by position.
 * @param requestedLimit The limit passed by the caller, if any.
 * @param idCount The number of item ids in the query.
 * @param maxQueueItems The user's maximum queue size. 0 means no limit.
 * @returns The limit to send, or undefined for no limit.
 */
export function resolveQueueLimit(
    requestedLimit: number | undefined,
    idCount: number,
    maxQueueItems: number
): number | undefined {
    if (requestedLimit) return requestedLimit;
    if (!maxQueueItems) return undefined;

    return idCount ? Math.max(maxQueueItems, LEGACY_QUEUE_LIMIT) : maxQueueItems;
}
