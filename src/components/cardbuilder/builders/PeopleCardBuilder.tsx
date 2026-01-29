import React from 'react';
import { CardOptions } from '../cardBuilder';
import CardBuilder from './CardBuilder';

interface PeopleCardBuilderProps {
    items: any[];
    options?: CardOptions;
    onItemClick?: (item: any) => void;
}

const PeopleCardBuilder: React.FC<PeopleCardBuilderProps> = ({
    items,
    options = {},
    onItemClick
}) => {
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

    return <CardBuilder items={items} options={peopleOptions} onItemClick={onItemClick} />;
};

export default PeopleCardBuilder;
