/**
 * Ensures indicators for a card exist and creates them if they don't exist.
 * @param {HTMLDivElement} card - DOM element of card.
 * @param {HTMLDivElement} indicatorsElem - DOM element of indicators.
 * @returns {HTMLDivElement} - DOM element of indicators.
 */
export function ensureIndicators(card, indicatorsElem) {
    if (indicatorsElem) {
        return indicatorsElem;
    }

    indicatorsElem = document.createElement('div');
    indicatorsElem.className = 'cardIndicators';
    return indicatorsElem;
}
