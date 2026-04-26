import React, { FC, useCallback } from 'react';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import Button from '@mui/material/Button';

import globalize from 'lib/globalize';

interface NewPlaylistButtonProps {
    isTextVisible: boolean;
}

const NewPlaylistButton: FC<NewPlaylistButtonProps> = ({
    isTextVisible
}) => {
    const showPlaylistEditor = useCallback(() => {
        import('components/playlisteditor/playlisteditor').then(
            ({ default: PlaylistEditor }) => {
                const serverId = window.ApiClient.serverId();
                const playlistEditor = new PlaylistEditor();
                playlistEditor.show({
                    items: [],
                    serverId
                }).catch(() => {
                    // closed playlist editor
                });
            }).catch(err => {
            console.error('[NewPlaylist] failed to load playlist editor', err);
        });
    }, []);

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
