import React, { FC } from 'react';
import { setCardData } from '../cardBuilder';
import Card from './Card';
import type { ItemDto } from 'types/itemDto';
import type { CardOptions } from 'types/cardOptions';
import '../card.scss';

interface CardsProps {
    items: ItemDto[];
    cardOptions: CardOptions;
}

const Cards: FC<CardsProps> = ({
    items = [],
    cardOptions
}) => {
    setCardData(items, cardOptions);
    return (
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
            {items?.map((item) => (
                <Card
                    key={item.Id}
                    item ={item}
                    cardOptions= {cardOptions}
                />
            ))}
        </>
    );
};

export default Cards;
