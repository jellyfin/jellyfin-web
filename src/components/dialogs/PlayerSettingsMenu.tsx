import React, { useState } from 'react';
import { Box } from 'ui-primitives';
import { Dialog, DialogContentComponent, DialogOverlayComponent, DialogPortal } from 'ui-primitives';
import { List, ListItem, ListItemButton, ListItemContent } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { CheckIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { useMediaStore, useQueueStore } from '../../store';
import globalize from '../../lib/globalize';
import { vars } from 'styles/tokens.css.ts';

interface PlayerSettingsMenuProps {
    open: boolean;
    onClose: () => void;
}

type MenuPage = 'main' | 'quality' | 'playback-rate' | 'aspect-ratio' | 'repeat-mode';

export const PlayerSettingsMenu: React.FC<PlayerSettingsMenuProps> = ({ open, onClose }) => {
    const [page, setPage] = useState<MenuPage>('main');
    const playbackRate = useMediaStore(state => state.playbackRate);
    // TODO: Fix usePlaybackActions import issue
    // const playbackActions = usePlaybackActions();
    // const setPlaybackRate = playbackActions.setPlaybackRate;
    // const toggleRepeatMode = playbackActions.toggleRepeatMode;
    const setPlaybackRate = (rate: number) => {};
    const toggleRepeatMode = () => {};

    const renderMainPage = () => (
        <>
            <Text as="h2" size="lg" weight="bold" style={{ marginBottom: vars.spacing['5'] }}>
                {globalize.translate('Settings')}
            </Text>
            <List>
                <ListItem>
                    <ListItemButton onClick={() => setPage('playback-rate')}>
                        <ListItemContent>
                            <Text weight="medium">{globalize.translate('PlaybackRate')}</Text>
                            <Text size="xs" color="secondary">
                                {playbackRate}x
                            </Text>
                        </ListItemContent>
                        <Box style={{ marginLeft: 'auto' }}>
                            <ChevronRightIcon />
                        </Box>
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton onClick={toggleRepeatMode}>
                        <ListItemContent>
                            <Text weight="medium">{globalize.translate('RepeatMode')}</Text>
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
                <Text as="h2" size="lg" weight="bold" style={{ marginBottom: vars.spacing['5'] }}>
                    {globalize.translate('PlaybackRate')}
                </Text>
                <List>
                    {rates.map(rate => (
                        <ListItem key={rate}>
                            <ListItemButton
                                onClick={() => {
                                    setPlaybackRate(rate);
                                    setPage('main');
                                }}
                            >
                                <ListItemContent>{rate}x</ListItemContent>
                                {playbackRate === rate && (
                                    <Box style={{ marginLeft: 'auto', color: vars.colors.primary }}>
                                        <CheckIcon />
                                    </Box>
                                )}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </>
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={nextOpen => {
                if (!nextOpen) {
                    setPage('main');
                    onClose();
                }
            }}
        >
            <DialogPortal>
                <DialogOverlayComponent />
                <DialogContentComponent
                    style={{
                        minWidth: 300,
                        maxWidth: '90vw'
                    }}
                >
                    {page === 'main' && renderMainPage()}
                    {page === 'playback-rate' && renderPlaybackRatePage()}
                </DialogContentComponent>
            </DialogPortal>
        </Dialog>
    );
};
