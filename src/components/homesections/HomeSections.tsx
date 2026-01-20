import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import CircularProgress from '@mui/joy/CircularProgress';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getUserViewsQuery } from '../../hooks/useUserViews';
import { toApi } from '../../utils/jellyfin-apiclient/compat';
import { queryClient } from '../../utils/query/queryClient';
import { HomeSectionType, DEFAULT_SECTIONS } from '../../types/homeSectionType';
import * as userSettings from '../../scripts/settings/userSettings';

import ResumeSection from './ResumeSection';
import NextUpSection from './NextUpSection';
import RecentlyAddedSection from './RecentlyAddedSection';
import LibraryTilesSection from './LibraryTilesSection';

const HomeSections: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userViews, setUserViews] = useState<any[]>([]);
    const [sections, setSections] = useState<HomeSectionType[]>([]);
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        const userId = apiClient.getCurrentUserId();
        
        queryClient.fetchQuery(getUserViewsQuery(toApi(apiClient), userId))
            .then(result => {
                setUserViews(result.Items || []);
                
                const userSections: HomeSectionType[] = [];
                for (let i = 0; i < 7; i++) {
                    let section = (userSettings as any).get('homesection' + i) as HomeSectionType || DEFAULT_SECTIONS[i];
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
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress thickness={4} size="lg" />
            </Box>
        );
    }

    return (
        <Box>
            {sections.map((section, index) => {
                switch (section) {
                    case HomeSectionType.SmallLibraryTiles:
                        return <LibraryTilesSection key={index} userViews={userViews} />;
                    case HomeSectionType.Resume:
                        return <ResumeSection key={index} mediaType="Video" titleLabel="HeaderContinueWatching" />;
                    case HomeSectionType.ResumeAudio:
                        return <ResumeSection key={index} mediaType="Audio" titleLabel="HeaderContinueListening" />;
                    case HomeSectionType.ResumeBook:
                        return <ResumeSection key={index} mediaType="Book" titleLabel="HeaderContinueReading" />;
                    case HomeSectionType.NextUp:
                        return <NextUpSection key={index} />;
                    case HomeSectionType.LatestMedia:
                        return <RecentlyAddedSection key={index} userViews={userViews} />;
                    default:
                        return null;
                }
            })}
        </Box>
    );
};

export default HomeSections;
