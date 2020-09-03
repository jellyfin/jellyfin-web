/* eslint-disable indent */

import dom from 'dom';
import appRouter from 'appRouter';

    function onGroupedCardClick(e, card) {
        var itemId = card.getAttribute('data-id');
        var serverId = card.getAttribute('data-serverid');
        var apiClient = window.connectionManager.getApiClient(serverId);
        var userId = apiClient.getCurrentUserId();
        var playedIndicator = card.querySelector('.playedIndicator');
        var playedIndicatorHtml = playedIndicator ? playedIndicator.innerHTML : null;
        var options = {
            Limit: parseInt(playedIndicatorHtml || '10'),
            Fields: 'PrimaryImageAspectRatio,DateCreated',
            ParentId: itemId,
            GroupItems: false
        };
        var actionableParent = dom.parentWithTag(e.target, ['A', 'BUTTON', 'INPUT']);

        if (!actionableParent || actionableParent.classList.contains('cardContent')) {
            apiClient.getJSON(apiClient.getUrl('Users/' + userId + '/Items/Latest', options)).then(function (items) {
                if (items.length === 1) {
                    return void appRouter.showItem(items[0]);
                }

                var url = 'details?id=' + itemId + '&serverId=' + serverId;
                Dashboard.navigate(url);
            });
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    }

    export default function onItemsContainerClick(e) {
        var groupedCard = dom.parentWithClass(e.target, 'groupedCard');

        if (groupedCard) {
            onGroupedCardClick(e, groupedCard);
        }
    }

/* eslint-enable indent */
