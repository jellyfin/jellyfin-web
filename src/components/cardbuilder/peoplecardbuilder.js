/**
 * Module for building cards from item data.
 * @module components/cardBuilder/peoplecardbuilder
 */

import cardBuilder from './cardBuilder';

export function buildPeopleCards(items, options) {
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

export default {
    buildPeopleCards: buildPeopleCards
};
