import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { ApiClient } from 'jellyfin-apiclient';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import * as userSettings from '../../scripts/settings/userSettings';
import loading from '../../components/loading/loading';
import dom from '../../scripts/dom';
import SectionContainer from '../../components/common/SectionContainer';
import globalize from '../../scripts/globalize';
import ServerConnections from '../../components/ServerConnections';
import { LibraryViewProps } from '../../types/interface';

const SuggestionsView: FC<LibraryViewProps> = ({topParentId}) => {
    const [ latestItems, setLatestItems ] = useState<BaseItemDto[]>([]);
    const [ resumeItems, setResumeItems ] = useState<BaseItemDto[]>([]);
    const [ nextUpItems, setNextUpItems ] = useState<BaseItemDto[]>([]);
    const element = useRef<HTMLDivElement>(null);

    const autoFocus = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        import('../../components/autoFocuser').then(({default: autoFocuser}) => {
            autoFocuser.autoFocus(page);
        });
    }, []);

    const fetchResume = useCallback((apiClient: ApiClient) => {
        const screenWidth = dom.getWindowSize().innerWidth;
        return apiClient.getItems(
            apiClient.getCurrentUserId(),
            {
                SortBy: 'DatePlayed',
                SortOrder: 'Descending',
                IncludeItemTypes: 'Episode',
                Filters: 'IsResumable',
                Limit: screenWidth >= 1600 ? 5 : 3,
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
                CollapseBoxSetItems: false,
                ParentId: topParentId,
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
                EnableTotalRecordCount: false
            }
        );
    }, [topParentId]);

    const fetchLatestEpisodes = useCallback((apiClient: ApiClient) => {
        return apiClient.getLatestItems(
            {
                userId: apiClient.getCurrentUserId(),
                IncludeItemTypes: 'Episode',
                Limit: 30,
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
                ParentId: topParentId,
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Thumb'
            }
        );
    }, [topParentId]);

    const fetchNextUp = useCallback((apiClient: ApiClient) => {
        return apiClient.getNextUpEpisodes(
            {
                userId: apiClient.getCurrentUserId(),
                Limit: 24,
                Fields: 'PrimaryImageAspectRatio,DateCreated,BasicSyncInfo,MediaSourceCount',
                ParentId: topParentId,
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false
            }
        );
    }, [topParentId]);

    const loadSuggestions = useCallback(() => {
        loading.show();
        const apiClient = ServerConnections.getApiClient(window.ApiClient.serverId());
        fetchNextUp(apiClient).then(result => {
            setNextUpItems(result.Items || []);

            autoFocus();
        });

        fetchLatestEpisodes(apiClient).then(items => {
            setLatestItems(items);

            autoFocus();
        });

        fetchResume(apiClient).then(result => {
            setResumeItems(result.Items || []);

            autoFocus();
            loading.hide();
        });
    }, [fetchResume, fetchLatestEpisodes, fetchNextUp, autoFocus]);

    useEffect(() => {
        loadSuggestions();
    }, [loadSuggestions]);

    return (
        <div ref={element}>
            <SectionContainer
                sectionTitle={globalize.translate('HeaderContinueWatching')}
                items={resumeItems}
                cardOptions={{
                    scalable: true,
                    overlayPlayButton: true,
                    showTitle: true,
                    centerText: true,
                    cardLayout: false,
                    shape: 'overflowBackdrop',
                    preferThumb: true,
                    inheritThumb: !userSettings.useEpisodeImagesInNextUpAndResume(undefined),
                    showYear: true
                }}
            />

            <SectionContainer
                sectionTitle={globalize.translate('HeaderLatestEpisodes')}
                items={latestItems}
                cardOptions={{
                    scalable: true,
                    overlayPlayButton: true,
                    showTitle: true,
                    centerText: true,
                    cardLayout: false,
                    shape: 'overflowBackdrop',
                    preferThumb: true,
                    showSeriesYear: true,
                    showParentTitle: true,
                    overlayText: false,
                    showUnplayedIndicator: false,
                    showChildCountIndicator: true,
                    lazy: true,
                    lines: 2
                }}
            />

            <SectionContainer
                sectionTitle={globalize.translate('NextUp')}
                items={nextUpItems}
                cardOptions={{
                    scalable: true,
                    overlayPlayButton: true,
                    showTitle: true,
                    centerText: true,
                    cardLayout: false,
                    shape: 'overflowBackdrop',
                    preferThumb: true,
                    inheritThumb: !userSettings.useEpisodeImagesInNextUpAndResume(undefined),
                    showParentTitle: true,
                    overlayText: false
                }}
            />
        </div>
    );
};

export default SuggestionsView;
