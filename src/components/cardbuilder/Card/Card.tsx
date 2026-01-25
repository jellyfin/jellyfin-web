import React, { type FC } from 'react';
import useCard from './useCard';
import CardWrapper from './CardWrapper';
import CardBox from './CardBox';

import type { CardOptions } from 'types/cardOptions';
import type { ItemDto } from 'types/base/models/item-dto';

interface CardProps {
    item?: ItemDto;
    cardOptions: CardOptions;
}

const Card: FC<CardProps> = ({ item = {}, cardOptions }) => {
    const { getCardWrapperProps, getCardBoxProps } = useCard({ item, cardOptions });
    const cardWrapperProps = getCardWrapperProps();
    const cardBoxProps = getCardBoxProps();
    return (
        <CardWrapper {...cardWrapperProps}>
            <CardBox {...cardBoxProps} />
        </CardWrapper>
    );
};

export default Card;
