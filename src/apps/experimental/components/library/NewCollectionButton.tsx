import React, { type FC, useCallback } from 'react';
import { PlusIcon } from '@radix-ui/react-icons';
import { Button } from 'ui-primitives/Button';

import globalize from 'lib/globalize';

interface NewCollectionButtonProps {
    isTextVisible: boolean
}

const NewCollectionButton: FC<NewCollectionButtonProps> = ({
    isTextVisible
}) => {
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
        <Button
            variant='primary'
            startIcon={isTextVisible ? <PlusIcon /> : undefined}
            onClick={showCollectionEditor}
        >
            {isTextVisible ? (
                globalize.translate('NewCollection')
            ) : (
                <PlusIcon />
            )}
        </Button>
    );
};

export default NewCollectionButton;
