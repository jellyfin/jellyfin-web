import { type FC, type PropsWithChildren, isValidElement} from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import classNames from 'classnames';
import ItemsContainer, {
    type ItemsContainerProps
} from 'elements/emby-itemscontainer/ItemsContainer';
import Scroller, { type ScrollerProps } from 'elements/emby-scroller/Scroller';
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

const SectionHeader: FC<SectionHeaderProps> = ({
    title,
    className,
    itemsLength = 0,
    url
}) => {
    const sectionHeaderClass = classNames(
        'sectionTitleContainer sectionTitleContainer-cards',
        'padded-left',
        className
    );

    return (
        <Box className={sectionHeaderClass}>
            {url && itemsLength > 5 ? (
                <Link
                    className='clearLink button-flat sectionTitleTextButton'
                    underline='none'
                    href={url}
                >
                    <Typography
                        className='sectionTitle sectionTitle-cards'
                        variant='h2'
                    >
                        {title}
                    </Typography>
                    <ChevronRightIcon sx={{ pt: '5px' }} />
                </Link>
            ) : (
                <Typography
                    className='sectionTitle sectionTitle-cards'
                    variant='h2'
                >
                    {title}
                </Typography>
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
        if (isValidElement(children)) {
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
            className={classNames(
                { scrollSlider: isScrollerMode },
                itemsContainerProps?.className
            )}
            {...itemsContainerProps}
        >
            {renderItems()}
        </ItemsContainer>
    );

    return (
        <Box className={sectionClass}>
            {sectionHeaderProps?.title && (
                <SectionHeader
                    className={classNames(
                        { 'no-padding': noPadding },
                        sectionHeaderProps?.className
                    )}
                    itemsLength={items.length}
                    {...sectionHeaderProps}
                />
            )}
            {isScrollerMode && !isListMode ? (
                <Scroller
                    className={classNames(
                        { 'no-padding': noPadding },
                        scrollerProps?.className
                    )}
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
