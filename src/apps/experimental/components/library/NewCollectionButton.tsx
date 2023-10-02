import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import globalize from 'scripts/globalize';

const NewCollectionButton: FC = () => {
    const showCollectionEditor = useCallback(() => {
        import('components/collectionEditor/collectionEditor').then(
            ({ default: CollectionEditor }) => {
                const serverId = window.ApiClient.serverId();
                const collectionEditor = new CollectionEditor();
                collectionEditor.show({
                    items: [],
                    serverId: serverId
                }).catch(() => {
                    // closed collection editor
                });
            }).catch(err => {
            console.error('[NewCollection] failed to load collection editor', err);
        });
    }, []);

    return (
        <IconButton
            title={globalize.translate('Add')}
            className='paper-icon-button-light btnNewCollection autoSize'
            onClick={showCollectionEditor}
        >
            <AddIcon />
        </IconButton>
    );
};

export default NewCollectionButton;
