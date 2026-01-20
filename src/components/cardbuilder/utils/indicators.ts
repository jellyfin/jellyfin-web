/**
 * Ensures indicators for a card exist and creates them if they don't exist.
 */
export function ensureIndicators(_card: HTMLElement, indicatorsElem?: HTMLElement): HTMLElement {
    if (indicatorsElem) return indicatorsElem;
    const elem = document.createElement('div');
    elem.className = 'cardIndicators';
    return elem;
}