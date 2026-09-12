import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIntersectionObserver } from 'usehooks-ts';

import Loading from 'components/loading/LoadingComponent';
import globalize from 'lib/globalize';

import { useSearchItems } from '../api/useSearchItems';
import type { Section } from '../types';
import SearchResultsRow from './SearchResultsRow';

interface SearchResultsProps {
    parentId?: string;
    collectionType?: CollectionType;
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
    const {
        sections,
        isPending,
        isPlaceholderData,
        hasNextSection,
        fetchNextSection
    } = useSearchItems(parentId, collectionType, query?.trim());

    const isLoading = isPending || isPlaceholderData;

    // Load the next section once the end of the results scrolls into view
    const { ref: sentinelRef, isIntersecting } = useIntersectionObserver({
        rootMargin: '200px'
    });

    useEffect(() => {
        if (isIntersecting && hasNextSection && !isLoading) {
            fetchNextSection();
        }
    }, [ isIntersecting, hasNextSection, isLoading, fetchNextSection ]);

    if (!sections.length && !isLoading && !hasNextSection) {
        return (
            <div className='noItemsMessage centerMessage'>
                {globalize.translate('SearchResultsEmpty', query)}
                {collectionType && (
                    <div>
                        <Link
                            className='emby-button'
                            to={`/search?query=${encodeURIComponent(query || '')}`}
                        >{globalize.translate('RetryWithGlobalSearch')}</Link>
                    </div>
                )}
            </div>
        );
    }

    // Sections arrive one at a time, so key by title rather than index to avoid remounting rows as earlier ones load
    const renderSection = (section: Section) => {
        return (
            <SearchResultsRow
                key={section.title}
                title={globalize.translate(section.title)}
                items={section.items}
                cardOptions={section.cardOptions}
            />
        );
    };

    return (
        <div className={'searchResults padded-top padded-bottom-page'}>
            {(isLoading || (hasNextSection && !sections.length)) && <Loading />}
            {sections.map(section => renderSection(section))}
            {hasNextSection && <div ref={sentinelRef} style={{ height: 1 }} />}
        </div>
    );
};

export default SearchResults;
