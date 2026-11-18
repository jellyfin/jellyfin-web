import Box from '@mui/material/Box';
import React, { useCallback, type FC } from 'react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import { Swiper, type SwiperClass, SwiperSlide } from 'swiper/react';

import Card from '@/components/cardbuilder/Card/Card';
import browser from '@/scripts/browser';
import type { ItemDto } from '@/types/base/models/item-dto';
import type { CardOptions } from '@/types/cardOptions';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/mousewheel';

interface ItemsScrollerProps {
    cardOptions: CardOptions
    items: ItemDto[]
    onNavigationStateChange?: (swiper: SwiperClass) => void
    onSwiper?: (swiper: SwiperClass) => void
}

/** Scrollable container for items backed by Swiper */
const ItemsScroller: FC<ItemsScrollerProps> = ({
    cardOptions,
    items,
    onNavigationStateChange,
    onSwiper
}) => {
    const onDragStartCapture = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    }, []);

    return (
        <Box
            // This wrapper is needed to prevent native drag events from interfering with Swiper
            onDragStartCapture={onDragStartCapture}
            sx={{
                width: '100%',
                userSelect: 'none'
            }}
        >
            <Swiper
                touchStartPreventDefault={false}
                preventClicksPropagation={false}
                onToEdge={onNavigationStateChange}
                onFromEdge={onNavigationStateChange}
                onResize={onNavigationStateChange}
                onUpdate={onNavigationStateChange}
                onSwiper={onSwiper}
                direction={'horizontal'}
                slidesPerView={'auto'}
                modules={[
                    FreeMode,
                    Mousewheel
                ]}
                freeMode={{
                    enabled: true,
                    sticky: !browser.mobile
                }}
                mousewheel={{
                    enabled: true,
                    forceToAxis: true
                }}
                className='padded-left padded-right'
            >
                {items.map(item => (
                    <SwiperSlide
                        key={item.Id}
                        style={{ width: 'auto' }}
                    >
                        <Card
                            item={item}
                            cardOptions={cardOptions}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </Box>
    );
};

export default ItemsScroller;
