import Alert from '@mui/material/Alert/Alert';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import React from 'react';
import { Link } from 'react-router-dom';

import Page from 'components/Page';
import globalize from 'scripts/globalize';

const DlnaPage = () => (
    <Page
        id='dlnaSettingsPage'
        title='DLNA'
        className='mainAnimatedPage type-interior'
    >
        <div className='content-primary'>
            <h2>DLNA</h2>
            <Alert severity='info'>
                <Box sx={{ marginBottom: 2 }}>
                    {globalize.translate('DlnaMovedMessage')}
                </Box>
                <Button
                    component={Link}
                    to='/dashboard/plugins/add?name=DLNA&guid=33eba9cd7da14720967fdd7dae7b74a1'
                >
                    {globalize.translate('GetThePlugin')}
                </Button>
            </Alert>
        </div>
    </Page>
);

export default DlnaPage;
