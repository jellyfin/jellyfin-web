import React, { type FC } from 'react';
import { Section, useSearchItems } from '../api/useSearchItems';
import globalize from '../../../../../lib/globalize';
import Loading from '../../../../../components/loading/LoadingComponent';
import SearchResultsRow from './SearchResultsRow';
import { CardShape } from 'utils/card';

interface SearchResultsProps {
    parentId?: string;
    collectionType?: string;
    query?: string;
}

/*
 * React component to display search result rows for global search and library view search
 */
const SearchResults: FC<SearchResultsProps> = ({
    parentId,
    collectionType,
    query
}) => {
    const { isLoading, data } = useSearchItems(parentId, collectionType, query);

    if (isLoading) return <Loading />;

    if (!data?.length) {
        return (
            <div className='noItemsMessage centerMessage'>
                {globalize.translate('SearchResultsEmpty', query)}
            </div>
        );
    }

    const renderSection = (section: Section, index: number) => {
        return (
            <SearchResultsRow
                key={`${section.title}-${index}`}
                title={globalize.translate(section.title)}
                items={section.items}
                cardOptions={{
                    shape: CardShape.AutoOverflow,
                    scalable: true,
                    showTitle: true,
                    overlayText: false,
                    centerText: true,
                    allowBottomPadding: false,
                    ...section.cardOptions
                }}
            />
        );
    };

    return (
        <div className={'searchResults, padded-top, padded-bottom-page'}>
            {data.map((section, index) => renderSection(section, index))}
        </div>
    );
};

export default SearchResults;
