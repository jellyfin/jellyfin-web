import React, { type FC } from 'react';
import { setCardData } from '../cardBuilder';
import Card from './Card';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';
import '../card.scss';

interface CardsProps {
    items: ItemDto[];
    cardOptions?: CardOptions;
}

const Cards: FC<CardsProps> = ({ items, cardOptions = {} }) => {
    setCardData(items, cardOptions);

    const renderCard = (item: ItemDto) => (
        <Card
            key={`${item.Id}-${item.Type}`}
            item={item}
            cardOptions={cardOptions}
        />
    );

    return items.map((item) => renderCard(item));
};

export default Cards;
