import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { CardBuilder } from '../cardbuilder/builders';
import { CardOptions } from '../cardbuilder/cardBuilder';
import * as userSettings from '../../scripts/settings/userSettings';

const NextUpSection: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        const oldestDateForNextUp = new Date();
        oldestDateForNextUp.setDate(oldestDateForNextUp.getDate() - (userSettings as any).maxDaysForNextUp());
        
        const options = {
            Limit: 24,
            Fields: 'PrimaryImageAspectRatio,DateCreated,Path,MediaSourceCount',
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            EnableTotalRecordCount: false,
            DisableFirstEpisode: false,
            NextUpDateCutoff: oldestDateForNextUp.toISOString(),
            EnableResumable: false,
            EnableRewatching: (userSettings as any).enableRewatchingInNextUp()
        };

        apiClient.getNextUpEpisodes(options).then((result: any) => {
            setItems(result.Items);
            setIsLoading(false);
        });
    }, [apiClient]);

    if (isLoading || items.length === 0) return null;

    const cardOptions: CardOptions = {
        shape: 'backdrop',
        showTitle: true,
        showParentTitle: true,
        overlayPlayButton: true,
        preferThumb: true,
        inheritThumb: !(userSettings as any).useEpisodeImagesInNextUpAndResume()
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography level="h3" sx={{ mb: 2, px: 1 }}>{globalize.translate('NextUp')}</Typography>
            <CardBuilder items={items} options={cardOptions} />
        </Box>
    );
};

export default NextUpSection;
