import React, { type FC } from 'react';
import Page from 'components/Page';
import AddServerForm from 'apps/experimental/features/session/components/AddServerForm';

const AddServer: FC = () => {
    return (
        <Page
            id='addserver'
            className='mainAnimatedPage standalonePage'
        >
            <div className='padded-left padded-right padded-bottom-page'>
                <AddServerForm />
            </div>
        </Page>
    );
};

export default AddServer;
