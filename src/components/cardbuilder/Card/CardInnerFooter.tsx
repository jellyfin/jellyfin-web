import React, { type FC } from 'react';
import classNames from 'classnames';
import CardFooterText from './CardFooterText';

import type { ItemDto } from '@/types/base/models/item-dto';
import type { CardOptions } from '@/types/cardOptions';

interface CardInnerFooterProps {
    item: ItemDto;
    cardOptions: CardOptions;
    imgUrl: string | undefined;
    progressBar?: React.JSX.Element | null;
    forceName: boolean;
    overlayText: boolean | undefined;
}

const CardInnerFooter: FC<CardInnerFooterProps> = ({
    item,
    cardOptions,
    imgUrl,
    overlayText,
    progressBar,
    forceName
}) => {
    const footerClass = classNames('innerCardFooter', {
        fullInnerCardFooter: progressBar
    });

    return (
        <CardFooterText
            item={item}
            cardOptions={cardOptions}
            forceName={forceName}
            overlayText={overlayText}
            imgUrl={imgUrl}
            footerClass={footerClass}
            progressBar={progressBar}
            isOuterFooter={false}
        />
    );
};

export default CardInnerFooter;
