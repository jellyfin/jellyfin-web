import layoutManager from '../components/layoutManager';
import datetime from './datetime';
import cardBuilder from '../components/cardbuilder/cardBuilder';

function enableScrollX() {
    return !layoutManager.desktop;
}

function getBackdropShape() {
    return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
}

function getTimersHtml(timers, options) {
    options = options || {};

    const items = timers.map(function (t) {
        t.Type = 'Timer';
        return t;
    });

    const groups = [];
    let currentGroupName = '';
    let currentGroup = [];

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
                console.error('error parsing premiereDate:' + item.StartDate + '; error: ' + err);
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

    if (currentGroup.length) {
        groups.push({
            name: currentGroupName,
            items: currentGroup
        });
    }
    let html = '';
    for (const group of groups) {
        if (group.name) {
            html += '<div class="verticalSection">';
            html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + group.name + '</h2>';
        }

        if (enableScrollX()) {
            let scrollXClass = 'scrollX hiddenScrollX';
            if (layoutManager.tv) {
                scrollXClass += ' smoothScrollX';
            }
            html += '<div is="jellyfin-itemscontainer" class="itemsContainer ' + scrollXClass + ' padded-left padded-right">';
        } else {
            html += '<div is="jellyfin-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
        }

        html += cardBuilder.getCardsHtml({
            items: group.items,
            shape: getBackdropShape(),
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

        if (group.name) {
            html += '</div>';
        }
    }
    return Promise.resolve(html);
}

window.LiveTvHelpers = {
    getTimersHtml: getTimersHtml
};
