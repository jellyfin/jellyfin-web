import React, { FC, useCallback, useEffect, useRef } from 'react';

import IconButtonElement from '../../elements/IconButtonElement';

const NewCollection: FC = () => {
    const element = useRef<HTMLDivElement>(null);

    const showCollectionEditor = useCallback(() => {
        import('../collectionEditor/collectionEditor').then(({ default: CollectionEditor }) => {
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

    useEffect(() => {
        const btnNewCollection = element.current?.querySelector('.btnNewCollection');
        if (btnNewCollection) {
            btnNewCollection.addEventListener('click', showCollectionEditor);
        }
    }, [showCollectionEditor]);

    return (
        <div ref={element}>
            <IconButtonElement
                is='paper-icon-button-light'
                className='btnNewCollection autoSize'
                title='Add'
                icon='material-icons add'
            />
        </div>
    );
};

export default NewCollection;
