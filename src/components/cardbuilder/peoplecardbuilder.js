define(['cardBuilder'], function (cardBuilder) {
    'use strict';

    function buildPeopleCards(items, options) {

        options = Object.assign(options || {}, {
            cardLayout: false,
            centerText: true,
            showTitle: true,
            cardFooterAside: 'none',
            showPersonRoleOrType: true,
            cardCssClass: 'personCard',
            defaultCardImageIcon: 'person'
        });
        cardBuilder.buildCards(items, options);
    }

    return {
        buildPeopleCards: buildPeopleCards
    };

});
