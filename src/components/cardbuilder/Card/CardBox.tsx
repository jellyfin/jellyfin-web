import layoutManager from 'components/layoutManager';
import { ItemAction } from 'constants/itemAction';
import React, { type FC } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';
import { CardShape } from 'utils/card';
import CardContent from './CardContent';
import CardHoverMenu from './CardHoverMenu';
import CardOuterFooter from './CardOuterFooter';
import CardOverlayButtons from './CardOverlayButtons';

interface CardBoxProps {
    action: ItemAction;
    item: ItemDto;
    cardOptions: CardOptions;
    className: string;
    shape: CardShape | undefined;
    imgUrl: string | undefined;
    blurhash: string | undefined;
    forceName: boolean;
    coveredImage: boolean;
    overlayText: boolean | undefined;
}

const CardBox: FC<CardBoxProps> = ({
    action,
    item,
    cardOptions,
    className,
    shape,
    imgUrl,
    blurhash,
    forceName,
    coveredImage,
    overlayText
}) => {
    return (
        <div className={className}>
            <div className="cardScalable">
                <div className={`cardPadder cardPadder-${shape}`}></div>
                <CardContent
                    item={item}
                    cardOptions={cardOptions}
                    coveredImage={coveredImage}
                    overlayText={overlayText}
                    imgUrl={imgUrl}
                    blurhash={blurhash}
                    forceName={forceName}
                />
                {layoutManager.mobile && (
                    <CardOverlayButtons item={item} cardOptions={cardOptions} />
                )}

                {layoutManager.desktop && !cardOptions.disableHoverMenu && (
                    <CardHoverMenu action={action} item={item} cardOptions={cardOptions} />
                )}
            </div>
            {!overlayText && (
                <CardOuterFooter
                    item={item}
                    cardOptions={cardOptions}
                    forceName={forceName}
                    overlayText={overlayText}
                    imgUrl={imgUrl}
                />
            )}
        </div>
    );
};

export default CardBox;
