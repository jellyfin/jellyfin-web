import React, { useCallback, useState } from 'react';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Divider from '@mui/joy/Divider';
import { EmbyInput, EmbyCheckbox } from '../../../../elements';
import globalize from '../../../../lib/globalize';
import { setSetting } from '../../core/Settings';
import Events from '../../../../utils/events';
import { pluginManager } from '../../../../components/pluginManager';
import { PluginType } from '../../../../types/plugin';

interface SyncPlaySettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

const SyncPlaySettingsDialog: React.FC<SyncPlaySettingsDialogProps> = ({ open, onClose }) => {
    const syncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;
    const manager = syncPlay?.Manager;

    const [ settings, setSettings ] = useState({
        extraTimeOffset: manager?.timeSyncCore.extraTimeOffset || 0,
        enableSyncCorrection: manager?.playbackCore.enableSyncCorrection || false,
        minDelaySpeedToSync: manager?.playbackCore.minDelaySpeedToSync || 0,
        maxDelaySpeedToSync: manager?.playbackCore.maxDelaySpeedToSync || 0,
        speedToSyncDuration: manager?.playbackCore.speedToSyncDuration || 0,
        minDelaySkipToSync: manager?.playbackCore.minDelaySkipToSync || 0,
        useSpeedToSync: manager?.playbackCore.useSpeedToSync || false,
        useSkipToSync: manager?.playbackCore.useSkipToSync || false,
    });

    const handleChange = (name: string, value: any) => {
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = useCallback(() => {
        Object.entries(settings).forEach(([key, value]) => {
            setSetting(key as any, value);
        });

        Events.trigger(manager, 'settings-update');
        onClose();
    }, [ settings, manager, onClose ]);

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ minWidth: { xs: '90%', sm: 500 }, maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
                <DialogTitle>{globalize.translate('HeaderSyncPlaySettings')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <Typography level="title-md">{globalize.translate('HeaderSyncPlayPlaybackSettings')}</Typography>
                        
                        <EmbyCheckbox
                            label={globalize.translate('LabelSyncPlaySettingsSyncCorrection')}
                            helperText={globalize.translate('LabelSyncPlaySettingsSyncCorrectionHelp')}
                            checked={settings.enableSyncCorrection}
                            onChange={(e) => handleChange('enableSyncCorrection', e.target.checked)}
                        />

                        <Divider />

                        <EmbyCheckbox
                            label={globalize.translate('LabelSyncPlaySettingsSpeedToSync')}
                            helperText={globalize.translate('LabelSyncPlaySettingsSpeedToSyncHelp')}
                            checked={settings.useSpeedToSync}
                            onChange={(e) => handleChange('useSpeedToSync', e.target.checked)}
                        />

                        <EmbyInput
                            type="number"
                            label={globalize.translate('LabelSyncPlaySettingsMinDelaySpeedToSync')}
                            helperText={globalize.translate('LabelSyncPlaySettingsMinDelaySpeedToSyncHelp')}
                            value={settings.minDelaySpeedToSync}
                            onChange={(e: any) => handleChange('minDelaySpeedToSync', parseInt(e.target.value, 10))}
                        />

                        <EmbyInput
                            type="number"
                            label={globalize.translate('LabelSyncPlaySettingsMaxDelaySpeedToSync')}
                            helperText={globalize.translate('LabelSyncPlaySettingsMaxDelaySpeedToSyncHelp')}
                            value={settings.maxDelaySpeedToSync}
                            onChange={(e: any) => handleChange('maxDelaySpeedToSync', parseInt(e.target.value, 10))}
                        />

                        <EmbyInput
                            type="number"
                            label={globalize.translate('LabelSyncPlaySettingsSpeedToSyncDuration')}
                            helperText={globalize.translate('LabelSyncPlaySettingsSpeedToSyncDurationHelp')}
                            value={settings.speedToSyncDuration}
                            onChange={(e: any) => handleChange('speedToSyncDuration', parseInt(e.target.value, 10))}
                        />

                        <Divider />

                        <EmbyCheckbox
                            label={globalize.translate('LabelSyncPlaySettingsSkipToSync')}
                            helperText={globalize.translate('LabelSyncPlaySettingsSkipToSyncHelp')}
                            checked={settings.useSkipToSync}
                            onChange={(e) => handleChange('useSkipToSync', e.target.checked)}
                        />

                        <EmbyInput
                            type="number"
                            label={globalize.translate('LabelSyncPlaySettingsMinDelaySkipToSync')}
                            helperText={globalize.translate('LabelSyncPlaySettingsMinDelaySkipToSyncHelp')}
                            value={settings.minDelaySkipToSync}
                            onChange={(e: any) => handleChange('minDelaySkipToSync', parseInt(e.target.value, 10))}
                        />

                        <Typography level="title-md">{globalize.translate('HeaderSyncPlayTimeSyncSettings')}</Typography>
                        
                        <EmbyInput
                            type="number"
                            label={globalize.translate('LabelSyncPlaySettingsExtraTimeOffset')}
                            helperText={globalize.translate('LabelSyncPlaySettingsExtraTimeOffsetHelp')}
                            value={settings.extraTimeOffset}
                            onChange={(e: any) => handleChange('extraTimeOffset', parseInt(e.target.value, 10))}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSave}>{globalize.translate('Save')}</Button>
                    <Button variant="plain" color="neutral" onClick={onClose}>{globalize.translate('ButtonCancel')}</Button>
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
};

export default SyncPlaySettingsDialog;
