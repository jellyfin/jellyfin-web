import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import classNames from 'classnames';
import useIndicator from 'components/indicators/useIndicator';
import RefreshIndicator from 'elements/emby-itemrefreshindicator/RefreshIndicator';
import Media from '../../common/Media';
import CardInnerFooter from './CardInnerFooter';

import { ItemKind } from 'types/base/models/item-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

interface CardImageContainerProps {
    item: ItemDto;
    cardOptions: CardOptions;
    coveredImage: boolean;
    overlayText: boolean | undefined;
    imgUrl: string | undefined;
    blurhash: string | undefined;
    forceName: boolean;
}

const CardImageContainer: FC<CardImageContainerProps> = ({
    item,
    cardOptions,
    coveredImage,
    overlayText,
    imgUrl,
    blurhash,
    forceName
}) => {
    const indicator = useIndicator(item);
    const cardImageClass = classNames(
        'cardImageContainer',
        { coveredImage: coveredImage },
        {
            'coveredImage-contain':
                coveredImage && item.Type === ItemKind.TvChannel
        }
    );

    return (
        <div className={cardImageClass}>
            {cardOptions.disableIndicators !== true && (
                <Box className='indicators'>
                    {indicator.getMediaSourceIndicator()}

                    <Box className='cardIndicators'>
                        {cardOptions.missingIndicator !== false &&
                            indicator.getMissingIndicator()}

                        {indicator.getTimerIndicator()}
                        {indicator.getTypeIndicator()}

                        {cardOptions.showGroupCount
                            ? indicator.getChildCountIndicator()
                            : indicator.getPlayedIndicator()}

                        {(item.Type === ItemKind.CollectionFolder ||
                            item.CollectionType) && (
                            <RefreshIndicator item={item} />
                        )}
                    </Box>
                </Box>
            )}

            <Media
                item={item}
                imgUrl={imgUrl}
                blurhash={blurhash}
                imageType={cardOptions.imageType}
            />

            {overlayText && (
                <CardInnerFooter
                    item={item}
                    cardOptions={cardOptions}
                    forceName={forceName}
                    overlayText={overlayText}
                    imgUrl={imgUrl}
                    progressBar={indicator.getProgressBar()}
                />
            )}

            {!overlayText && indicator.getProgressBar()}
        </div>
    );
};

export default CardImageContainer;
