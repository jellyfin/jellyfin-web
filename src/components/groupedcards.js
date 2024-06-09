import dom from '../scripts/dom';
import { appRouter } from './router/appRouter';
import Dashboard from '../utils/dashboard';
import ServerConnections from './ServerConnections';

function onGroupedCardClick(e, card) {
    const itemId = card.getAttribute('data-id');
    const serverId = card.getAttribute('data-serverid');
    const apiClient = ServerConnections.getApiClient(serverId);
    const userId = apiClient.getCurrentUserId();
    const playedIndicator = card.querySelector('.playedIndicator');
    const playedIndicatorHtml = playedIndicator ? playedIndicator.innerHTML : null;
    const options = {
        Limit: parseInt(playedIndicatorHtml || '10', 10),
        Fields: 'PrimaryImageAspectRatio,DateCreated',
        ParentId: itemId,
        GroupItems: false
    };
    const actionableParent = dom.parentWithTag(e.target, ['A', 'BUTTON', 'INPUT']);

    if (!actionableParent || actionableParent.classList.contains('cardContent')) {
        apiClient.getJSON(apiClient.getUrl('Users/' + userId + '/Items/Latest', options)).then(function (items) {
            if (items.length === 1) {
                appRouter.showItem(items[0]);
                return;
            }

            const url = 'details?id=' + itemId + '&serverId=' + serverId;
            Dashboard.navigate(url);
        });
        e.stopPropagation();
        e.preventDefault();
        return false;
    }
}

export default function onItemsContainerClick(e) {
    const groupedCard = dom.parentWithClass(e.target, 'groupedCard');

    if (groupedCard) {
        onGroupedCardClick(e, groupedCard);
    }
}
