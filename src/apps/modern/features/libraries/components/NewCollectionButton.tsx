import React, { FC, useCallback } from 'react';
import Add from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import type { QueryKey } from '@tanstack/react-query';

import globalize from 'lib/globalize';
import { queryClient } from 'utils/query/queryClient';

interface NewCollectionButtonProps {
    isTextVisible: boolean
    queryKey: QueryKey
}

const NewCollectionButton: FC<NewCollectionButtonProps> = ({
    isTextVisible,
    queryKey
}) => {
    const showCollectionEditor = useCallback(() => {
        import('components/collectionEditor/collectionEditor')
            .then(async ({ default: CollectionEditor }) => {
                const serverId = window.ApiClient.serverId();
                const collectionEditor = new CollectionEditor();
                try {
                    await collectionEditor.show({
                        items: [],
                        serverId: serverId
                    });
                    void queryClient.invalidateQueries({ queryKey });
                } catch {
                    //closed collection editor
                }
            })
            .catch(err => {
                console.error('[NewCollection] failed to load collection editor', err);
            });
    }, [ queryKey ]);

    return (
        <Button
            variant='contained'
            startIcon={isTextVisible ? <Add /> : undefined}
            onClick={showCollectionEditor}
        >
            {isTextVisible ? (
                globalize.translate('NewCollection')
            ) : (
                <Add />
            )}
        </Button>
    );
};

export default NewCollectionButton;
