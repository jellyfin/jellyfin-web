import { vars } from '../../../../styles/tokens.css';

import React, { useCallback, useState } from 'react';
import { Dialog, DialogOverlayComponent, DialogContentComponent, DialogTitle } from 'ui-primitives/Dialog';
import { Button } from 'ui-primitives/Button';
import { Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Divider } from 'ui-primitives/Divider';
import { Checkbox } from 'ui-primitives/Checkbox';
import { Input } from 'ui-primitives/Input';
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

    const [settings, setSettings] = useState({
        extraTimeOffset: manager?.timeSyncCore.extraTimeOffset || 0,
        enableSyncCorrection: manager?.playbackCore.enableSyncCorrection || false,
        minDelaySpeedToSync: manager?.playbackCore.minDelaySpeedToSync || 0,
        maxDelaySpeedToSync: manager?.playbackCore.maxDelaySpeedToSync || 0,
        speedToSyncDuration: manager?.playbackCore.speedToSyncDuration || 0,
        minDelaySkipToSync: manager?.playbackCore.minDelaySkipToSync || 0,
        useSpeedToSync: manager?.playbackCore.useSpeedToSync || false,
        useSkipToSync: manager?.playbackCore.useSkipToSync || false
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
    }, [settings, manager, onClose]);

    return (
        <Dialog open={open} onOpenChange={open => !open && onClose()}>
            <DialogOverlayComponent />
            <DialogContentComponent
                title={globalize.translate('HeaderSyncPlaySettings')}
                style={{
                    minWidth: 'min(90%, 500px)',
                    maxWidth: 600,
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: vars.spacing['5']
                }}
            >
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'], marginTop: vars.spacing['2'] }}>
                    <Text as="h4" size="lg" weight="bold">
                        {globalize.translate('HeaderSyncPlayPlaybackSettings')}
                    </Text>

                    <Flex direction="column" gap={vars.spacing['2']}>
                        <Checkbox
                            checked={settings.enableSyncCorrection}
                            onChange={(e: any) => handleChange('enableSyncCorrection', e.target.checked)}
                        >
                            {globalize.translate('LabelSyncPlaySettingsSyncCorrection')}
                        </Checkbox>
                        <Text size="sm" style={{ opacity: 0.7, paddingLeft: vars.spacing['5'] }}>
                            {globalize.translate('LabelSyncPlaySettingsSyncCorrectionHelp')}
                        </Text>
                    </Flex>

                    <Divider />

                    <Flex direction="column" gap={vars.spacing['2']}>
                        <Checkbox
                            checked={settings.useSpeedToSync}
                            onChange={(e: any) => handleChange('useSpeedToSync', e.target.checked)}
                        >
                            {globalize.translate('LabelSyncPlaySettingsSpeedToSync')}
                        </Checkbox>
                        <Text size="sm" style={{ opacity: 0.7, paddingLeft: vars.spacing['5'] }}>
                            {globalize.translate('LabelSyncPlaySettingsSpeedToSyncHelp')}
                        </Text>
                    </Flex>

                    <Input
                        type="number"
                        label={globalize.translate('LabelSyncPlaySettingsMinDelaySpeedToSync')}
                        helperText={globalize.translate('LabelSyncPlaySettingsMinDelaySpeedToSyncHelp')}
                        value={settings.minDelaySpeedToSync}
                        onChange={(e: any) => handleChange('minDelaySpeedToSync', parseInt(e.target.value, 10))}
                    />

                    <Input
                        type="number"
                        label={globalize.translate('LabelSyncPlaySettingsMaxDelaySpeedToSync')}
                        helperText={globalize.translate('LabelSyncPlaySettingsMaxDelaySpeedToSyncHelp')}
                        value={settings.maxDelaySpeedToSync}
                        onChange={(e: any) => handleChange('maxDelaySpeedToSync', parseInt(e.target.value, 10))}
                    />

                    <Input
                        type="number"
                        label={globalize.translate('LabelSyncPlaySettingsSpeedToSyncDuration')}
                        helperText={globalize.translate('LabelSyncPlaySettingsSpeedToSyncDurationHelp')}
                        value={settings.speedToSyncDuration}
                        onChange={(e: any) => handleChange('speedToSyncDuration', parseInt(e.target.value, 10))}
                    />

                    <Divider />

                    <Flex direction="column" gap={vars.spacing['2']}>
                        <Checkbox
                            checked={settings.useSkipToSync}
                            onChange={(e: any) => handleChange('useSkipToSync', e.target.checked)}
                        >
                            {globalize.translate('LabelSyncPlaySettingsSkipToSync')}
                        </Checkbox>
                        <Text size="sm" style={{ opacity: 0.7, paddingLeft: vars.spacing['5'] }}>
                            {globalize.translate('LabelSyncPlaySettingsSkipToSyncHelp')}
                        </Text>
                    </Flex>

                    <Input
                        type="number"
                        label={globalize.translate('LabelSyncPlaySettingsMinDelaySkipToSync')}
                        helperText={globalize.translate('LabelSyncPlaySettingsMinDelaySkipToSyncHelp')}
                        value={settings.minDelaySkipToSync}
                        onChange={(e: any) => handleChange('minDelaySkipToSync', parseInt(e.target.value, 10))}
                    />

                    <Text as="h4" size="lg" weight="bold">
                        {globalize.translate('HeaderSyncPlayTimeSyncSettings')}
                    </Text>

                    <Input
                        type="number"
                        label={globalize.translate('LabelSyncPlaySettingsExtraTimeOffset')}
                        helperText={globalize.translate('LabelSyncPlaySettingsExtraTimeOffsetHelp')}
                        value={settings.extraTimeOffset}
                        onChange={(e: any) => handleChange('extraTimeOffset', parseInt(e.target.value, 10))}
                    />
                </Flex>

                <Flex style={{ justifyContent: 'flex-end', gap: vars.spacing['2'], marginTop: vars.spacing['5'] }}>
                    <Button onClick={handleSave}>{globalize.translate('Save')}</Button>
                    <Button variant="plain" color="neutral" onClick={onClose}>
                        {globalize.translate('ButtonCancel')}
                    </Button>
                </Flex>
            </DialogContentComponent>
        </Dialog>
    );
};

export default SyncPlaySettingsDialog;
