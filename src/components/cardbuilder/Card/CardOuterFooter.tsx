import React, { type FC } from 'react';
import classNames from 'classnames';
import { useApi } from 'hooks/useApi';
import { getCardLogoUrl } from './cardHelper';
import CardFooterText from './CardFooterText';

import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

interface CardOuterFooterProps {
    item: ItemDto
    cardOptions: CardOptions;
    imgUrl: string | undefined;
    forceName: boolean;
    overlayText: boolean | undefined
}

const CardOuterFooter: FC<CardOuterFooterProps> = ({ item, cardOptions, overlayText, imgUrl, forceName }) => {
    const { api } = useApi();
    const logoInfo = getCardLogoUrl(item, api, cardOptions);
    const logoUrl = logoInfo.logoUrl;

    const footerClass = classNames(
        'cardFooter',
        { 'cardFooter-transparent': cardOptions.cardLayout },
        { 'cardFooter-withlogo': logoUrl }
    );

    return (
        <CardFooterText
            item={item}
            cardOptions={cardOptions}
            forceName={forceName}
            overlayText={overlayText}
            imgUrl={imgUrl}
            footerClass={footerClass}
            progressBar={undefined}
            logoUrl={logoUrl}
            isOuterFooter={true}
        />

    );
};

export default CardOuterFooter;
