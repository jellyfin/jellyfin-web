import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';

interface NoPluginResultsProps {
    isFiltered: boolean
    onViewAll: () => void
    query: string
}

const NoPluginResults: FC<NoPluginResultsProps> = ({
    isFiltered,
    onViewAll,
    query
}) => {
    return (
        <Box
            sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
                bgcolor: 'background.surface',
                borderRadius: 'md',
                border: '1px dashed',
                borderColor: 'divider'
            }}
        >
            <Typography
                level="title-lg"
                sx={{
                    mb: 1
                }}
            >
                {
                    query ?
                        globalize.translate('SearchResultsEmpty', query) :
                        globalize.translate('NoSubtitleSearchResultsFound')
                }
            </Typography>

            {isFiltered && (
                <Button
                    variant='plain'
                    color="primary"
                    onClick={onViewAll}
                    sx={{ mt: 1 }}
                >
                    {globalize.translate('ViewAllPlugins')}
                </Button>
            )}
        </Box>
    );
};

export default NoPluginResults;