import React, { FC } from 'react';
import IconButton from '../../elements/emby-button/IconButton';

const NewCollection: FC = () => {
    const showCollectionEditor = () => {
        import('../collectionEditor/collectionEditor').then(({default: CollectionEditor}) => {
            const serverId = window.ApiClient.serverId();
            const collectionEditor = new CollectionEditor();
            collectionEditor.show({
                items: [],
                serverId: serverId
            });
        });
    };

    return (
        <IconButton
            type='button'
            className='btnNewCollection autoSize'
            title='Add'
            icon='add'
            onClick={showCollectionEditor}
        />
    );
};

export default NewCollection;
