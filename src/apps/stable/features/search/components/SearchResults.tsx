import React, { useCallback, type FC } from 'react';
import { useSearchItems } from '../api/useSearchItems';
import globalize from '../../../../../lib/globalize';
import Loading from '../../../../../components/loading/LoadingComponent';
import SearchResultsRow from './SearchResultsRow';
import { CardShape } from 'utils/card';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { Section } from '../types';
import LinkButton from 'elements/emby-button/LinkButton';
import { useLocation, useSearchParams } from 'react-router-dom';

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
    const { data, isPending } = useSearchItems(parentId, collectionType, query?.trim());
    const location = useLocation();
    const [ searchParams ] = useSearchParams();

    const getUri = useCallback(() => {
        searchParams.delete('collectionType');
        return `${location.pathname}?${searchParams.toString()}`;
    }, [ searchParams, location.pathname ]);

    if (isPending) return <Loading />;

    if (!data?.length) {
        return (
            <div className='noItemsMessage centerMessage'>
                {globalize.translate('SearchResultsEmpty', query)}
                {collectionType && (
                    <div>
                        <LinkButton href={getUri()}>{globalize.translate('RetryWithGlobalSearch')}</LinkButton>
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
