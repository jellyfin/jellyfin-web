import React, { useCallback, useEffect, useState } from 'react';
import { Box, Flex } from 'ui-primitives';
import { CircularProgress } from 'ui-primitives';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getUserViewsQuery } from 'hooks/useUserViews';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { queryClient } from 'utils/query/queryClient';
import { HomeSectionType, DEFAULT_SECTIONS } from 'types/homeSectionType';
import * as userSettings from 'scripts/settings/userSettings';
import ResumeSection from 'components/homesections/ResumeSection';
import NextUpSection from 'components/homesections/NextUpSection';
import RecentlyAddedSection from 'components/homesections/RecentlyAddedSection';
import LibraryTilesSection from 'components/homesections/LibraryTilesSection';
import * as styles from 'components/homesections/HomeSections.css.ts';

interface HomeTabProps {
    autoFocus?: boolean;
}

const HomeTab: React.FC<HomeTabProps> = ({ autoFocus = false }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userViews, setUserViews] = useState<any[]>([]);
    const [sections, setSections] = useState<HomeSectionType[]>([]);
    const apiClient = ServerConnections.currentApiClient();
    const userId = apiClient?.getCurrentUserId();

    useEffect(() => {
        if (!apiClient || !userId) {
            setIsLoading(false);
            return;
        }

        queryClient
            .fetchQuery(getUserViewsQuery(toApi(apiClient), userId))
            .then(result => {
                setUserViews(result.Items || []);

                const userSections: HomeSectionType[] = [];
                for (let i = 0; i < 7; i++) {
                    const settingValue = userSettings.get('homesection' + i) as HomeSectionType | undefined;
                    let section = settingValue || DEFAULT_SECTIONS[i];
                    if (section && section !== HomeSectionType.None) {
                        userSections.push(section);
                    }
                }
                setSections(userSections);
                setIsLoading(false);
            })
            .catch((err: Error) => {
                console.error('[HomeTab] Failed to load user views:', err);
                setIsLoading(false);
            });
    }, [apiClient, userId]);

    if (isLoading) {
        return (
            <Box
                className={styles.loadingContainer}
                style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}
            >
                <CircularProgress size="lg" />
            </Box>
        );
    }

    return (
        <Box className={styles.container} style={{ paddingBottom: '2rem' }}>
            {sections.map(section => {
                switch (section) {
                    case HomeSectionType.SmallLibraryTiles:
                        return <LibraryTilesSection key={section} userViews={userViews} />;
                    case HomeSectionType.Resume:
                        return <ResumeSection key={section} mediaType="Video" titleLabel="HeaderContinueWatching" />;
                    case HomeSectionType.ResumeAudio:
                        return <ResumeSection key={section} mediaType="Audio" titleLabel="HeaderContinueListening" />;
                    case HomeSectionType.ResumeBook:
                        return <ResumeSection key={section} mediaType="Book" titleLabel="HeaderContinueReading" />;
                    case HomeSectionType.NextUp:
                        return <NextUpSection key={section} />;
                    case HomeSectionType.LatestMedia:
                        return <RecentlyAddedSection key={section} userViews={userViews} />;
                    default:
                        return null;
                }
            })}
        </Box>
    );
};

export default HomeTab;
