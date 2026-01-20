import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { CardBuilder } from '../cardbuilder/builders';
import { CardOptions } from '../cardbuilder/cardBuilder';

interface RecentlyAddedLibrarySectionProps {
    library: any;
}

const RecentlyAddedLibrarySection: React.FC<RecentlyAddedLibrarySectionProps> = ({ library }) => {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        const options = {
            Limit: 16,
            Fields: 'PrimaryImageAspectRatio,Path',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb',
            ParentId: library.Id
        };

        apiClient.getLatestItems(options).then((result: any) => {
            setItems(result);
            setIsLoading(false);
        });
    }, [apiClient, library.Id]);

    if (isLoading || items.length === 0) return null;

    let shape = 'backdrop';
    if (library.CollectionType === 'movies' || library.CollectionType === 'books' || library.CollectionType === 'tvshows') {
        shape = 'portrait';
    } else if (library.CollectionType === 'music' || library.CollectionType === 'homevideos') {
        shape = 'square';
    }

    const cardOptions: CardOptions = {
        shape,
        showTitle: library.CollectionType !== 'photos',
        showYear: library.CollectionType === 'movies' || library.CollectionType === 'tvshows' || !library.CollectionType,
        showParentTitle: library.CollectionType === 'music' || library.CollectionType === 'tvshows' || !library.CollectionType,
        overlayPlayButton: library.CollectionType !== 'photos',
        lines: 2
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography level="h3" sx={{ mb: 2, px: 1 }}>
                {globalize.translate('LatestFromLibrary', library.Name)}
            </Typography>
            <CardBuilder items={items} options={cardOptions} />
        </Box>
    );
};

interface RecentlyAddedSectionProps {
    userViews: any[];
}

const RecentlyAddedSection: React.FC<RecentlyAddedSectionProps> = ({ userViews }) => {
    const excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels', 'folders'];
    
    const librariesToShow = userViews.filter(item => 
        item.Id && (!item.CollectionType || !excludeViewTypes.includes(item.CollectionType))
    );

    return (
        <>
            {librariesToShow.map(lib => (
                <RecentlyAddedLibrarySection key={lib.Id} library={lib} />
            ))}
        </>
    );
};

export default RecentlyAddedSection;
