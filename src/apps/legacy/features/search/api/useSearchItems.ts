import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { keepPreviousData, type QueryFunctionContext, useQueries } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import layoutManager from 'components/layoutManager';
import { useApi } from 'hooks/useApi';
import dom from 'utils/dom';

import { getSearchLimit } from '../utils/searchLimit';
import { getSearchSections, INITIAL_SECTION_COUNT } from './searchSections';

export const useSearchItems = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;
    const displayMissingEpisodes = user?.Configuration?.DisplayMissingEpisodes;

    const sectionSpecs = useMemo(() => getSearchSections(collectionType), [ collectionType ]);

    // Size each request for the screen once per mount; a resize mid-session is not worth refetching for
    const [ windowSize ] = useState(() => dom.getWindowSize());

    // Sections load a few at a time as the user scrolls. Start over whenever the search itself changes.
    const scope = `${collectionType ?? ''}|${parentId ?? ''}|${searchTerm ?? ''}`;
    const [ loaded, setLoaded ] = useState({ scope, count: INITIAL_SECTION_COUNT });
    const activeCount = loaded.scope === scope ? loaded.count : INITIAL_SECTION_COUNT;

    const results = useQueries({
        queries: sectionSpecs.slice(0, activeCount).map(spec => {
            const limit = getSearchLimit(spec.shape, windowSize.innerWidth, windowSize.innerHeight, layoutManager.tv);

            return {
                queryKey: [ 'Search', spec.id, collectionType, parentId, searchTerm, limit ],
                queryFn: ({ signal }: QueryFunctionContext) => spec.fetch(
                    api!,
                    userId!,
                    { parentId, searchTerm, limit, displayMissingEpisodes },
                    { signal }
                ),
                enabled: !!api && !!userId,
                // Keep showing the previous results while a new search term is loading
                placeholderData: keepPreviousData
            };
        })
    });

    const hasNextSection = activeCount < sectionSpecs.length;

    const fetchNextSection = useCallback(() => {
        setLoaded(previous => ({
            scope,
            count: Math.min((previous.scope === scope ? previous.count : INITIAL_SECTION_COUNT) + 1, sectionSpecs.length)
        }));
    }, [ scope, sectionSpecs.length ]);

    return {
        sections: results.flatMap(result => result.data ?? []),
        isPending: results.some(result => result.isPending),
        isPlaceholderData: results.some(result => result.isPlaceholderData),
        hasNextSection,
        fetchNextSection
    };
};
