import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useEffect, useState } from 'react';
import { CircularProgress } from 'ui-primitives';
import { getUserViewsQuery } from '../../hooks/useUserViews';
import * as userSettings from '../../scripts/settings/userSettings';
import { DEFAULT_SECTIONS, HomeSectionType } from '../../types/homeSectionType';
import { toApi } from '../../utils/jellyfin-apiclient/compat';
import { queryClient } from '../../utils/query/queryClient';
import * as styles from './HomeSections.css.ts';
import LibraryTilesSection from './LibraryTilesSection';
import NextUpSection from './NextUpSection';
import RecentlyAddedSection from './RecentlyAddedSection';
import ResumeSection from './ResumeSection';

const HomeSections: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userViews, setUserViews] = useState<any[]>([]);
    const [sections, setSections] = useState<HomeSectionType[]>([]);
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        if (!apiClient) return;
        const userId = apiClient.getCurrentUserId();

        queryClient.fetchQuery(getUserViewsQuery(toApi(apiClient), userId)).then((result) => {
            setUserViews(result.Items || []);

            const userSections: HomeSectionType[] = [];
            for (let i = 0; i < 7; i++) {
                const section =
                    ((userSettings as any).get('homesection' + i) as HomeSectionType) ||
                    DEFAULT_SECTIONS[i];
                if (section && section !== HomeSectionType.None) {
                    userSections.push(section);
                }
            }
            setSections(userSections);
            setIsLoading(false);
        });
    }, [apiClient]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularProgress size="lg" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {sections.map((section, index) => {
                switch (section) {
                    case HomeSectionType.SmallLibraryTiles:
                        return <LibraryTilesSection key={index} userViews={userViews} />;
                    case HomeSectionType.Resume:
                        return (
                            <ResumeSection
                                key={index}
                                mediaType="Video"
                                titleLabel="HeaderContinueWatching"
                            />
                        );
                    case HomeSectionType.ResumeAudio:
                        return (
                            <ResumeSection
                                key={index}
                                mediaType="Audio"
                                titleLabel="HeaderContinueListening"
                            />
                        );
                    case HomeSectionType.ResumeBook:
                        return (
                            <ResumeSection
                                key={index}
                                mediaType="Book"
                                titleLabel="HeaderContinueReading"
                            />
                        );
                    case HomeSectionType.NextUp:
                        return <NextUpSection key={index} />;
                    case HomeSectionType.LatestMedia:
                        return <RecentlyAddedSection key={index} userViews={userViews} />;
                    default:
                        return null;
                }
            })}
        </div>
    );
};

export default HomeSections;
