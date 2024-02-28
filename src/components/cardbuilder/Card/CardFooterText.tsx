import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import useCardText from './useCardText';
import layoutManager from 'components/layoutManager';
import MoreVertIconButton from '../../common/MoreVertIconButton';
import type { ItemDto } from 'types/itemDto';
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

interface LogoComponentProps {
    logoUrl: string;
}

const LogoComponent: FC<LogoComponentProps> = ({ logoUrl }) => {
    return <Box className='lazy cardFooterLogo' data-src={logoUrl} />;
};

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
        item,
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
        <Box className={footerClass}>
            {logoUrl && <LogoComponent logoUrl={logoUrl} />}
            {shouldShowDetailsMenu(cardOptions, isOuterFooter) && (
                <MoreVertIconButton className='itemAction btnCardOptions' />
            )}

            {cardTextLines}

            {progressBar}
        </Box>
    );
};

export default CardFooterText;
