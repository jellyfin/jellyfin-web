import React, { FunctionComponent, useEffect, useRef } from 'react';

import IconButtonElement from '../../elements/IconButtonElement';

const NewCollection: FunctionComponent = () => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const btnNewCollection = element.current?.querySelector('.btnNewCollection') as HTMLButtonElement;
        if (btnNewCollection) {
            btnNewCollection.addEventListener('click', () => {
                import('../../components/collectionEditor/collectionEditor').then(({default: CollectionEditor}) => {
                    const serverId = window.ApiClient.serverId();
                    const collectionEditor = new CollectionEditor();
                    collectionEditor.show({
                        items: [],
                        serverId: serverId
                    });
                });
            });
        }
    }, []);

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
