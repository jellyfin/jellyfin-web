import React, { type FC } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';
import CardBox from './CardBox';
import CardWrapper from './CardWrapper';
import useCard from './useCard';

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
