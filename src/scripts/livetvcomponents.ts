import cardBuilder from '../components/cardbuilder/cardBuilder';
import layoutManager from '../components/layoutManager';
import { getBackdropShape } from '../utils/card';
import { logger } from '../utils/logger';
import datetime from './datetime';

function enableScrollX(): boolean {
    return !layoutManager.desktop;
}

export async function getTimersHtml(timers: any[], options: any = {}): Promise<string> {
    const items = timers.map((t) => ({ ...t, Type: 'Timer' }));
    const groups: { name: string; items: any[] }[] = [];
    let currentGroupName = '';
    let currentGroup: any[] = [];

    for (const item of items) {
        let dateText = '';
        if (options.indexByDate !== false && item.StartDate) {
            try {
                const premiereDate = datetime.parseISO8601Date(item.StartDate, true);
                dateText = datetime.toLocaleDateString(premiereDate, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (err) {
                logger.error(
                    `Error parsing premiereDate: ${item.StartDate}`,
                    { component: 'livetvcomponents' },
                    err as Error
                );
            }
        }

        if (dateText !== currentGroupName) {
            if (currentGroup.length) groups.push({ name: currentGroupName, items: currentGroup });
            currentGroupName = dateText;
            currentGroup = [item];
        } else {
            currentGroup.push(item);
        }
    }

    if (currentGroup.length) groups.push({ name: currentGroupName, items: currentGroup });

    let html = '';
    for (const group of groups) {
        if (group.name) {
            html += `<div class="verticalSection"><h2 class="sectionTitle sectionTitle-cards padded-left">${group.name}</h2>`;
        }

        const scrollXClass = enableScrollX()
            ? `scrollX hiddenScrollX${layoutManager.tv ? ' smoothScrollX' : ''}`
            : 'vertical-wrap';
        html += `<div is="emby-itemscontainer" class="itemsContainer ${scrollXClass} padded-left padded-right">`;

        html += (cardBuilder as any).getCardsHtml({
            items: group.items,
            shape: getBackdropShape(enableScrollX()),
            showTitle: true,
            showParentTitleOrTitle: true,
            showAirTime: true,
            showAirEndTime: true,
            showChannelName: false,
            cardLayout: true,
            centerText: false,
            action: 'edit',
            cardFooterAside: 'none',
            preferThumb: true,
            defaultShape: null,
            coverImage: true,
            allowBottomPadding: false,
            overlayText: false,
            showChannelLogo: true
        });

        html += '</div>';
        if (group.name) html += '</div>';
    }
    return html;
}

const livetvcomponents = { getTimersHtml };
export default livetvcomponents;
