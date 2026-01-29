import { type CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { CardOptions } from 'components/cardbuilder/cardBuilder';
import Loading from 'components/loading/LoadingComponent';
import globalize from 'lib/globalize';
import React, { type FC } from 'react';
import { CardShape } from 'utils/card';
import { useSearchItems } from '../api/useSearchItems';
import { type Section } from '../types';
import SearchResultsRow from './SearchResultsRow';

interface SearchResultsProps {
    parentId?: string;
    collectionType?: CollectionType;
    query?: string;
}

/*
 * React component to display search result rows for global search and library view search
 */
const SearchResults: FC<SearchResultsProps> = ({ parentId, collectionType, query }) => {
    const { data, isPending } = useSearchItems(parentId, collectionType, query?.trim());

    if (isPending) return <Loading />;

    if (!data?.length) {
        return (
            <div className="noItemsMessage centerMessage">
                {globalize.translate('SearchResultsEmpty', query)}
                {collectionType && (
                    <div>
                        <a
                            className="emby-button"
                            href={`/search?query=${encodeURIComponent(query || '')}`}
                        >
                            {globalize.translate('RetryWithGlobalSearch')}
                        </a>
                    </div>
                )}
            </div>
        );
    }

    const renderSection = (section: Section, index: number) => {
        return (
            <SearchResultsRow
                key={`${section.title}-${index}`}
                title={globalize.translate(section.title)}
                items={section.items}
                cardOptions={
                    {
                        shape: CardShape.AutoOverflow,
                        scalable: true,
                        overlayText: false,
                        centerText: true,
                        allowBottomPadding: false,
                        ...section.cardOptions,
                        showTitle: true
                    } as CardOptions
                }
            />
        );
    };

    return (
        <div className={'searchResults padded-top padded-bottom-page'}>
            {data.map((section, index) => renderSection(section, index))}
        </div>
    );
};

export default SearchResults;
