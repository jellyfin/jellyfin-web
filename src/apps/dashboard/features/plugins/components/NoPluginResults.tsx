import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';

interface NoPluginResultsProps {
    isFiltered: boolean;
    onViewAll: () => void;
    query: string;
}

const NoPluginResults: FC<NoPluginResultsProps> = ({
    isFiltered,
    onViewAll,
    query
}) => {
    return (
        <Box
            sx={{
                textAlign: 'center'
            }}
        >
            <Typography
                component='div'
                sx={{
                    marginTop: 2,
                    marginBottom: 1
                }}
            >
                {query
                    ? globalize.translate('SearchResultsEmpty', query)
                    : globalize.translate('NoSubtitleSearchResultsFound')}
            </Typography>

            {isFiltered && (
                <Button variant='text' onClick={onViewAll}>
                    {globalize.translate('ViewAllPlugins')}
                </Button>
            )}
        </Box>
    );
};

export default NoPluginResults;
