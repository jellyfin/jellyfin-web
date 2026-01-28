import React, { type FC, type PropsWithChildren } from 'react';
import { Box } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import classNames from 'classnames';
import ItemsContainer, { type ItemsContainerProps } from '../items/ItemsContainer';
import Scroller, { type ScrollerProps } from '../scroller/Scroller';
import Cards from 'components/cardbuilder/Card/Cards';
import Lists from 'components/listview/List/Lists';
import type { CardOptions } from 'types/cardOptions';
import type { ListOptions } from 'types/listOptions';
import type { ItemDto } from 'types/base/models/item-dto';

interface SectionHeaderProps {
    className?: string;
    itemsLength?: number;
    url?: string;
    title: string;
}

const SectionHeader: FC<SectionHeaderProps> = ({ title, className, itemsLength = 0, url }) => {
    const sectionHeaderClass = classNames(
        'sectionTitleContainer sectionTitleContainer-cards',
        'padded-left',
        className
    );

    return (
        <Box className={sectionHeaderClass}>
            {url && itemsLength > 5 ? (
                <Box as="a" className="clearLink button-flat sectionTitleTextButton" href={url}>
                    <Text as="h2" size="xxl" weight="bold" className="sectionTitle sectionTitle-cards">
                        {title}
                    </Text>
                    <ChevronRightIcon style={{ paddingTop: '5px' }} />
                </Box>
            ) : (
                <Text as="h2" size="xxl" weight="bold" className="sectionTitle sectionTitle-cards">
                    {title}
                </Text>
            )}
        </Box>
    );
};

interface SectionContainerProps {
    className?: string;
    items?: ItemDto[];
    sectionHeaderProps?: Omit<SectionHeaderProps, 'itemsLength'>;
    scrollerProps?: ScrollerProps;
    itemsContainerProps?: ItemsContainerProps;
    isListMode?: boolean;
    isScrollerMode?: boolean;
    noPadding?: boolean;
    cardOptions?: CardOptions;
    listOptions?: ListOptions;
}

const SectionContainer: FC<PropsWithChildren<SectionContainerProps>> = ({
    className,
    sectionHeaderProps,
    scrollerProps,
    itemsContainerProps,
    isListMode = false,
    isScrollerMode = true,
    noPadding = false,
    items = [],
    cardOptions = {},
    listOptions = {},
    children
}) => {
    const sectionClass = classNames('verticalSection', className);

    const renderItems = () => {
        if (React.isValidElement(children)) {
            return children;
        }

        if (isListMode && !isScrollerMode) {
            return <Lists items={items} listOptions={listOptions} />;
        } else {
            return <Cards items={items} cardOptions={cardOptions} />;
        }
    };

    const content = (
        <ItemsContainer
            className={classNames({ scrollSlider: isScrollerMode }, itemsContainerProps?.className)}
            {...itemsContainerProps}
        >
            {renderItems()}
        </ItemsContainer>
    );

    return (
        <Box className={sectionClass}>
            {sectionHeaderProps?.title && (
                <SectionHeader
                    className={classNames({ 'no-padding': noPadding }, sectionHeaderProps?.className)}
                    itemsLength={items.length}
                    {...sectionHeaderProps}
                />
            )}
            {isScrollerMode && !isListMode ? (
                <Scroller
                    className={classNames({ 'no-padding': noPadding }, scrollerProps?.className)}
                    {...scrollerProps}
                >
                    {content}
                </Scroller>
            ) : (
                content
            )}
        </Box>
    );
};

export default SectionContainer;
