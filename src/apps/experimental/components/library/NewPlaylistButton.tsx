import React, { FC, useCallback } from 'react';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import Button from '@mui/material/Button';
import type { QueryKey } from '@tanstack/react-query';

import globalize from 'lib/globalize';
import { queryClient } from 'utils/query/queryClient';

interface NewPlaylistButtonProps {
    isTextVisible: boolean
    queryKey: QueryKey
}

const NewPlaylistButton: FC<NewPlaylistButtonProps> = ({
    isTextVisible,
    queryKey
}) => {
    const showPlaylistEditor = useCallback(() => {
        import('components/playlisteditor/playlisteditor')
            .then(async ({ default: PlaylistEditor }) => {
                const serverId = window.ApiClient.serverId();
                const playlistEditor = new PlaylistEditor();
                try {
                    await playlistEditor.show({
                        items: [],
                        serverId
                    });
                    void queryClient.invalidateQueries({ queryKey });
                } catch {
                    // closed playlist editor
                }
            })
            .catch(err => {
                console.error('[NewPlaylist] failed to load playlist editor', err);
            });
    }, [ queryKey ]);

    return (
        <Button
            variant='contained'
            startIcon={isTextVisible ? <PlaylistAdd /> : undefined}
            onClick={showPlaylistEditor}
        >
            {isTextVisible ? (
                globalize.translate('NewPlaylist')
            ) : (
                <PlaylistAdd />
            )}
        </Button>
    );
};

export default NewPlaylistButton;
