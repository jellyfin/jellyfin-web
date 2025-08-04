import React from 'react';
import Box from '@mui/material/Box';
import classNames from 'classnames';
import layoutManager from 'components/layoutManager';
import CardText from './CardText';
import { getCardTextLines } from './cardHelper';

import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

const enableRightMargin = (
    isOuterFooter: boolean,
    cardLayout: boolean | null | undefined,
    centerText: boolean | undefined,
    cardFooterAside: string | undefined
) => {
    return (
        isOuterFooter &&
        cardLayout &&
        !centerText &&
        cardFooterAside !== 'none' &&
        layoutManager.mobile
    );
};

interface UseCardTextProps {
    item: ItemDto;
    cardOptions: CardOptions;
    forceName: boolean;
    overlayText: boolean | undefined;
    imgUrl: string | undefined;
    isOuterFooter: boolean;
    cssClass: string;
    forceLines: boolean;
    maxLines: number | undefined;
}

function useCardText({
    item,
    cardOptions,
    forceName,
    imgUrl,
    overlayText,
    isOuterFooter,
    cssClass,
    forceLines,
    maxLines
}: UseCardTextProps) {
    const { textLines } = getCardTextLines({
        isOuterFooter,
        overlayText,
        forceName,
        item,
        cardOptions,
        imgUrl
    });

    const addRightMargin = enableRightMargin(
        isOuterFooter,
        cardOptions.cardLayout,
        cardOptions.centerText,
        cardOptions.cardFooterAside
    );

    const renderCardTextLines = () => {
        const components: React.ReactNode[] = [];
        let valid = 0;
        for (const textLine of textLines) {
            const currentCssClass = classNames(
                cssClass,
                {
                    'cardText-secondary': valid > 0 && isOuterFooter
                },
                { 'cardText-first': valid === 0 && isOuterFooter },
                { 'cardText-rightmargin': addRightMargin }
            );

            if (textLine) {
                components.push(
                    <CardText
                        key={valid}
                        className={currentCssClass}
                        textLine={textLine}
                    />
                );

                valid++;
                if (maxLines && valid >= maxLines) {
                    break;
                }
            }
        }

        if (forceLines) {
            const linesLength =
                maxLines ??
                Math.min(textLines.length, maxLines ?? textLines.length);
            while (valid < linesLength) {
                components.push(
                    <Box key={valid} className={cssClass}>
                        &nbsp;
                    </Box>
                );
                valid++;
            }
        }

        return components;
    };

    const cardTextLines = renderCardTextLines();

    return {
        cardTextLines
    };
}

export default useCardText;
