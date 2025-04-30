import React, { FC, useEffect, useState } from 'react';

import Page from 'components/Page';
import globalize from 'lib/globalize';
import { ConnectionState } from 'lib/jellyfin-apiclient';

interface ConnectionErrorPageProps {
    state: ConnectionState
}

const ConnectionErrorPage: FC<ConnectionErrorPageProps> = ({
    state
}) => {
    const [ title, setTitle ] = useState<string>();
    const [ htmlMessage, setHtmlMessage ] = useState<string>();

    useEffect(() => {
        if (state === ConnectionState.ServerUpdateNeeded) {
            setTitle(globalize.translate('HeaderUpdateRequired'));
            setHtmlMessage(globalize.translate(
                'ServerUpdateNeeded',
                '<a href="https://jellyfin.org/downloads/server/">jellyfin.org/downloads/server</a>'
            ));
        }
    }, [ state ]);

    if (!title) return;

    return (
        <Page
            id='connectionErrorPage'
            className='mainAnimatedPage standalonePage'
            isBackButtonEnabled={false}
        >
            <div className='padded-left padded-right'>
                <h1>{title}</h1>
                {htmlMessage && (
                    <p dangerouslySetInnerHTML={{ __html: htmlMessage }} />
                )}
            </div>
        </Page>
    );
};

export default ConnectionErrorPage;
