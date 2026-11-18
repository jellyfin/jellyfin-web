import React, { type FC, type PropsWithChildren } from 'react';
import Box from '@mui/material/Box';
import useCardText from './useCardText';
import layoutManager from 'components/layoutManager';
import MoreVertIconButton from 'components/common/MoreVertIconButton';
import Image from 'components/common/Image';

import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

const shouldShowDetailsMenu = (
    cardOptions: CardOptions,
    isOuterFooter: boolean
) => {
    return (
        cardOptions.showDetailsMenu
        && isOuterFooter
        && cardOptions.cardLayout
        && layoutManager.mobile
        && cardOptions.cardFooterAside !== 'none'
    );
};

interface CardFooterWrapperProps {
    cardOptions: CardOptions;
    footerClass?: string;
    isOuterFooter: boolean;
    logoUrl?: string;
}

/** Component that conditionally wraps the footer content based on the card options and presence of a logo. */
const CardFooterWrapper: FC<PropsWithChildren<CardFooterWrapperProps>> = ({
    cardOptions,
    footerClass,
    isOuterFooter,
    logoUrl,
    children
}) => (
    (!isOuterFooter || logoUrl || cardOptions.cardLayout) ? (
        <Box className={footerClass}>
            {children}
        </Box>
    ) : children
);

interface LogoComponentProps {
    logoUrl: string;
}

const LogoComponent: FC<LogoComponentProps> = ({ logoUrl }) => (
    <Box className='cardFooterLogo'>
        <Image
            imgUrl={logoUrl}
            containImage
        />
    </Box>
);

interface CardFooterTextProps {
    item: ItemDto;
    cardOptions: CardOptions;
    forceName: boolean;
    overlayText: boolean | undefined;
    imgUrl: string | undefined;
    footerClass: string | undefined;
    progressBar?: React.JSX.Element | null;
    logoUrl?: string;
    isOuterFooter: boolean;
}

const CardFooterText: FC<CardFooterTextProps> = ({
    item,
    cardOptions,
    forceName,
    imgUrl,
    footerClass,
    overlayText,
    progressBar,
    logoUrl,
    isOuterFooter
}) => {
    const { cardTextLines } = useCardText({
        item: item.ProgramInfo || item,
        cardOptions,
        forceName,
        imgUrl,
        overlayText,
        isOuterFooter,
        cssClass: cardOptions.centerText ?
            'cardText cardTextCentered' :
            'cardText',
        forceLines: !cardOptions.overlayText,
        maxLines: cardOptions.lines
    });

    return (
        <CardFooterWrapper
            cardOptions={cardOptions}
            footerClass={footerClass}
            isOuterFooter={isOuterFooter}
            logoUrl={logoUrl}
        >
            {logoUrl && <LogoComponent logoUrl={logoUrl} />}
            {shouldShowDetailsMenu(cardOptions, isOuterFooter) && (
                <MoreVertIconButton className='itemAction btnCardOptions' />
            )}

            {cardTextLines}

            {progressBar}
        </CardFooterWrapper>
    );
};

export default CardFooterText;
