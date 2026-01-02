import React, { type FC } from 'react';
import { setCardData } from '@/components/cardbuilder/cardBuilder';
import Card from './Card';
import type { ItemDto } from '@/types/base/models/item-dto';
import type { CardOptions } from '@/types/cardOptions';
import '@/components/cardbuilder/card.scss';

interface CardsProps {
    items: ItemDto[];
    cardOptions: CardOptions;
}

const Cards: FC<CardsProps> = ({ items, cardOptions }) => {
    setCardData(items, cardOptions);

    const renderCards = () =>
        items.map((item) => (
            <Card key={item.Id} item={item} cardOptions={cardOptions} />
        ));

    return <>{renderCards()}</>;
};

export default Cards;
