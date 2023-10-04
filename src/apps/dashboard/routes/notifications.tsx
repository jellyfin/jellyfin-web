import React from 'react';

import Page from 'components/Page';
import globalize from 'scripts/globalize';

const PluginLink = () => (
    <div
        dangerouslySetInnerHTML={{
            __html: `<a
                is='emby-linkbutton'
                class='button-link'
                href='#/dashboard/plugins/add?name=Webhook&guid=71552a5a5c5c4350a2aeebe451a30173'
            >
                ${globalize.translate('GetThePlugin')}
            </a>`
        }}
    />
);

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
            <PluginLink />
        </div>
    </Page>
);

export default Notifications;
