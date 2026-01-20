import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import globalize from 'lib/globalize';
import { CardBuilder } from '../cardbuilder/builders';
import { CardOptions } from '../cardbuilder/cardBuilder';

interface LibraryTilesSectionProps {
    userViews: any[];
}

const LibraryTilesSection: React.FC<LibraryTilesSectionProps> = ({ userViews }) => {
    if (userViews.length === 0) return null;

    const cardOptions: CardOptions = {
        shape: 'backdrop',
        showTitle: true,
        centerText: true,
        overlayText: false
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography level="h3" sx={{ mb: 2, px: 1 }}>{globalize.translate('HeaderMyMedia')}</Typography>
            <CardBuilder items={userViews} options={cardOptions} />
        </Box>
    );
};

export default LibraryTilesSection;
