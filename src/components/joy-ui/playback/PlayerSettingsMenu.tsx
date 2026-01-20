import React, { useState } from 'react';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import Divider from '@mui/joy/Divider';
import Box from '@mui/joy/Box';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Check from '@mui/icons-material/Check';
import { usePlaybackStatus, usePlaybackActions, useMediaStore } from '../../../store';
import globalize from '../../../lib/globalize';

interface PlayerSettingsMenuProps {
    open: boolean;
    onClose: () => void;
}

type MenuPage = 'main' | 'quality' | 'playback-rate' | 'aspect-ratio' | 'repeat-mode';

export const PlayerSettingsMenu: React.FC<PlayerSettingsMenuProps> = ({ open, onClose }) => {
    const [page, setPage] = useState<MenuPage>('main');
    const status = usePlaybackStatus();
    const currentItem = useMediaStore(state => state.currentItem);
    const playbackRate = useMediaStore(state => state.playbackRate);
    const { setPlaybackRate, toggleRepeatMode } = usePlaybackActions();

    const renderMainPage = () => (
        <>
            <Typography level="title-lg" sx={{ mb: 2 }}>{globalize.translate('Settings')}</Typography>
            <List sx={{ '--ListItem-radius': '8px' }}>
                <ListItem>
                    <ListItemButton onClick={() => setPage('playback-rate')}>
                        <ListItemContent>
                            <Typography level="title-md">{globalize.translate('PlaybackRate')}</Typography>
                            <Typography level="body-xs">{playbackRate}x</Typography>
                        </ListItemContent>
                        <ChevronRight />
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton onClick={toggleRepeatMode}>
                        <ListItemContent>
                            <Typography level="title-md">{globalize.translate('RepeatMode')}</Typography>
                        </ListItemContent>
                    </ListItemButton>
                </ListItem>
            </List>
        </>
    );

    const renderPlaybackRatePage = () => {
        const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        return (
            <>
                <Typography level="title-lg" sx={{ mb: 2 }}>{globalize.translate('PlaybackRate')}</Typography>
                <List>
                    {rates.map(rate => (
                        <ListItem key={rate}>
                            <ListItemButton onClick={() => { setPlaybackRate(rate); setPage('main'); }}>
                                <ListItemContent>{rate}x</ListItemContent>
                                {playbackRate === rate && <Check color="primary" />}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </>
        );
    };

    return (
        <Modal open={open} onClose={() => { setPage('main'); onClose(); }}>
            <ModalDialog
                variant="outlined"
                sx={{
                    minWidth: 300,
                    maxWidth: '90vw',
                    bgcolor: 'background.surface',
                    boxShadow: 'lg',
                }}
            >
                {page === 'main' && renderMainPage()}
                {page === 'playback-rate' && renderPlaybackRatePage()}
            </ModalDialog>
        </Modal>
    );
};
