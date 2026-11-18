import React, { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { Link as RouterLink } from 'react-router-dom';
import { type SwiperClass } from 'swiper/react';

import Card from '@/components/cardbuilder/Card/Card';
import { setCardData } from '@/components/cardbuilder/cardBuilder';
import ItemsScroller from '@/components/common/ItemsScroller';
import ItemsContainer, { type ItemsContainerProps } from '@/elements/emby-itemscontainer/ItemsContainer';
import browser from '@/scripts/browser';
import type { CardOptions } from '@/types/cardOptions';
import type { ItemDto } from '@/types/base/models/item-dto';

/** The minimum number of items required to enable header linking */
const MIN_ITEMS_FOR_LINKING = 5;
/** The minimum number of slides that are shown per view */
const MIN_SLIDES_PER_VIEW = 3;

const enum SectionVariant {
    Grid = 'grid',
    Scroller = 'scroller'
}

interface SectionHeaderProps {
    url?: string;
    title: string;
}

const SectionHeader: FC<SectionHeaderProps> = ({
    title,
    url
}) => {
    const titleComponent = (
        <Typography
            variant='h2'
            sx={{
                display: 'inline-block',
                // Match the padding of MUI Buttons
                padding: url ? undefined : '6px 8px'
            }}
        >
            {title}
        </Typography>
    );

    return (
        url ? (
            <Button
                component={RouterLink}
                to={url}
                variant='text'
                color='inherit'
                endIcon={<ChevronRight />}
            >
                {titleComponent}
            </Button>
        ) : (
            titleComponent
        )
    );
};

interface SectionContainerProps {
    variant?: `${SectionVariant}`;
    title: string;
    url?: string;
    items?: ItemDto[];
    itemsContainerProps?: ItemsContainerProps;
    cardOptions?: CardOptions;
}

const SectionContainer: FC<SectionContainerProps> = ({
    variant = SectionVariant.Scroller,
    title,
    url,
    items = [],
    cardOptions = {},
    itemsContainerProps = {}
}) => {
    const [ swiper, setSwiper ] = useState<SwiperClass>();
    const [ isBeginning, setIsBeginning ] = useState(true);
    const [ isEnd, setIsEnd ] = useState(true);

    const finalCardOptions = useMemo<CardOptions>(() => {
        // NOTE: setCardData modifies cardOptions so we create a shallow copy so the original stays a stable reference
        const options = { ...cardOptions };
        setCardData(items, options);
        return options;
    }, [ items, cardOptions ]);

    const nextSlide = useCallback(() => {
        // NOTE: Swiper seems to round up for partial slides so we need to subtract 1
        const slidesPerView = swiper ? Math.max(swiper.slidesPerViewDynamic() - 1, MIN_SLIDES_PER_VIEW) : 0;
        swiper?.slideTo(swiper.activeIndex + slidesPerView);
    }, [swiper]);

    const previousSlide = useCallback(() => {
        // NOTE: Swiper seems to round up for partial slides so we need to subtract 1
        const slidesPerView = swiper ? Math.max(swiper.slidesPerViewDynamic() - 1, MIN_SLIDES_PER_VIEW) : 0;
        swiper?.slideTo(swiper.activeIndex - slidesPerView);
    }, [swiper]);

    const syncNavigationState = useCallback((sw: SwiperClass) => {
        setIsBeginning(sw.isBeginning);
        setIsEnd(sw.isEnd);
    }, []);

    useEffect(() => {
        if (swiper) {
            syncNavigationState(swiper);
        }
    }, [swiper, syncNavigationState]);

    return (
        <Box>
            <Toolbar
                variant='dense'
                className='padded-left padded-right'
            >
                <Box sx={{ flexGrow: 1 }}>
                    <SectionHeader
                        title={title}
                        url={items.length > MIN_ITEMS_FOR_LINKING ? url : undefined}
                    />
                </Box>
                {!browser.mobile && (!isBeginning || !isEnd) && (
                    <ButtonGroup
                        variant='text'
                        color='inherit'
                    >
                        <Button
                            disabled={isBeginning}
                            onClick={previousSlide}
                        >
                            <ChevronLeft />
                        </Button>
                        <Button
                            disabled={isEnd}
                            onClick={nextSlide}
                        >
                            <ChevronRight />
                        </Button>
                    </ButtonGroup>
                )}
            </Toolbar>

            <ItemsContainer {...itemsContainerProps}>
                {variant === SectionVariant.Grid ? (
                    items.map(item => (
                        <Card
                            key={item.Id}
                            item={item}
                            cardOptions={finalCardOptions}
                        />
                    ))
                ) : (
                    <ItemsScroller
                        cardOptions={finalCardOptions}
                        items={items}
                        onNavigationStateChange={syncNavigationState}
                        onSwiper={setSwiper}
                    />
                )}
            </ItemsContainer>
        </Box>
    );
};

export default SectionContainer;
