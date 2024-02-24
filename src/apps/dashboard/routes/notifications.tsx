import React from 'react';

import Page from 'components/Page';
import globalize from 'scripts/globalize';
import LinkButton from 'elements/emby-button/LinkButton';

const Notifications = () => (
    <Page
        id='notificationSettingPage'
        title={globalize.translate('Notifications')}
        className='mainAnimatedPage type-interior'
    >
        <div className='content-primary'>
            <h2>{globalize.translate('Notifications')}</h2>
            <p>
                {globalize.translate('NotificationsMovedMessage')}
            </p>
            <LinkButton
                className='button-link'
                href='#/dashboard/plugins/add?name=Webhook&guid=71552a5a5c5c4350a2aeebe451a30173'>
                {globalize.translate('GetThePlugin')}
            </LinkButton>
        </div>
    </Page>
);

export default Notifications;
