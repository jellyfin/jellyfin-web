import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { CardBuilder } from '../cardbuilder/builders';
import { CardOptions } from '../cardbuilder/cardBuilder';

interface ResumeSectionProps {
    mediaType: 'Video' | 'Audio' | 'Book';
    titleLabel: string;
}

const ResumeSection: React.FC<ResumeSectionProps> = ({ mediaType, titleLabel }) => {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        const options = {
            Limit: 12,
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb',
            EnableTotalRecordCount: false,
            MediaTypes: mediaType
        };

        apiClient.getResumableItems(apiClient.getCurrentUserId(), options).then((result: any) => {
            setItems(result.Items);
            setIsLoading(false);
        });
    }, [apiClient, mediaType]);

    if (isLoading || items.length === 0) return null;

    const cardOptions: CardOptions = {
        shape: mediaType === 'Book' ? 'portrait' : 'backdrop',
        showTitle: true,
        showParentTitle: true,
        overlayPlayButton: true,
        showYear: true,
        lines: 2
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography level="h3" sx={{ mb: 2, px: 1 }}>{globalize.translate(titleLabel)}</Typography>
            <CardBuilder items={items} options={cardOptions} />
        </Box>
    );
};

export default ResumeSection;
