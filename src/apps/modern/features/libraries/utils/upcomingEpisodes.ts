import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';

type GroupsUpcomingEpisodes = {
    name: string;
    items: ItemDto[];
};

/** Groups upcoming episodes by their premiere date. */
export function groupsUpcomingEpisodes(items: ItemDto[]) {
    const groups: GroupsUpcomingEpisodes[] = [];
    let currentGroupName = '';
    let currentGroup: ItemDto[] = [];

    for (const item of items) {
        let dateText = '';

        if (item.PremiereDate) {
            try {
                const premiereDate = datetime.parseISO8601Date(
                    item.PremiereDate,
                    true
                );
                dateText = datetime.isRelativeDay(premiereDate, -1) ?
                    globalize.translate('Yesterday') :
                    datetime.toLocaleDateString(premiereDate, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    });
            } catch {
                console.error('error parsing timestamp for upcoming tv shows');
            }
        }

        if (dateText != currentGroupName) {
            if (currentGroup.length) {
                groups.push({
                    name: currentGroupName,
                    items: currentGroup
                });
            }

            currentGroupName = dateText;
            currentGroup = [item];
        } else {
            currentGroup.push(item);
        }
    }
    return groups;
}
