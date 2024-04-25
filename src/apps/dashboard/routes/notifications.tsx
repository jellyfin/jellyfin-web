import Alert from '@mui/material/Alert/Alert';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import React from 'react';
import { Link } from 'react-router-dom';

import Page from 'components/Page';
import globalize from 'scripts/globalize';

const NotificationsPage = () => (
    <Page
        id='notificationSettingPage'
        title={globalize.translate('Notifications')}
        className='mainAnimatedPage type-interior'
    >
        <div className='content-primary'>
            <h2>{globalize.translate('Notifications')}</h2>

            <Alert severity='info'>
                <Box sx={{ marginBottom: 2 }}>
                    {globalize.translate('NotificationsMovedMessage')}
                </Box>
                <Button
                    component={Link}
                    to='/dashboard/plugins/add?name=Webhook&guid=71552a5a5c5c4350a2aeebe451a30173'
                >
                    {globalize.translate('GetThePlugin')}
                </Button>
            </Alert>
        </div>
    </Page>
);

export default NotificationsPage;
