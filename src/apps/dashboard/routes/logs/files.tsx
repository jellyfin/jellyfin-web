import React from 'react';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useServerLogs } from 'apps/dashboard/features/logs/api/useServerLogs';
import LogItemList from 'apps/dashboard/features/logs/components/LogItemList';

export const Component = () => {
    const { isPending: isLogEntriesPending, data: logs } = useServerLogs();

    if (isLogEntriesPending || !logs) {
        return <Loading />;
    }

    return (
        <Page
            id='logPage'
            title={globalize.translate('TabLogs')}
            className='mainAnimatedPage type-interior'
        >
            <Stack spacing={3}>
                <Box className='content-primary'>
                    <Typography variant='h1'>
                        {globalize.translate('TabLogFiles')}
                    </Typography>
                    <Box className='serverLogs readOnlyContent' sx={{ mt: 3 }}>
                        <LogItemList logs={logs} />
                    </Box>
                </Box>
            </Stack>
        </Page>
    );
};

Component.displayName = 'LogsFilesPage';
