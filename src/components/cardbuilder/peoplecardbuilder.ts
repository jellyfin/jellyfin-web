import cardBuilder, { CardOptions } from './cardBuilder';

export function buildPeopleCards(items: any[], options: CardOptions = {}): void {
    const peopleOptions: CardOptions = {
        ...options,
        cardLayout: false,
        centerText: true,
        showTitle: true,
        cardFooterAside: 'none',
        showPersonRoleOrType: true,
        cardCssClass: 'personCard',
        defaultCardImageIcon: 'person'
    };
    (cardBuilder as any).buildCards(items, peopleOptions);
}

const peopleCardBuilder = { buildPeopleCards };
export default peopleCardBuilder;