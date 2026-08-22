import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

/**
 * Picks the season a series details page should open on.
 *
 * An explicitly requested season wins, so a refreshed or shared url reopens the season
 * the user was reading. Otherwise the season holding the Next Up episode wins, so the
 * page points at the episode the user is actually on. Anything else falls back to the
 * first season.
 *
 * @returns The season id, or undefined if there is no season to show.
 */
export function getPreferredSeasonId(
    seasons: BaseItemDto[],
    nextUpEpisode?: BaseItemDto | null,
    requestedSeasonId?: string | null
): string | undefined {
    const requestedSeason = requestedSeasonId ?
        seasons.find(season => season.Id === requestedSeasonId) :
        undefined;

    if (requestedSeason?.Id) return requestedSeason.Id;

    const nextUpSeasonId = nextUpEpisode?.SeasonId;
    const nextUpSeason = nextUpSeasonId ?
        seasons.find(season => season.Id === nextUpSeasonId) :
        undefined;

    return nextUpSeason?.Id ?? seasons.find(season => !!season.Id)?.Id;
}
