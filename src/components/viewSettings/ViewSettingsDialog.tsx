import React, { useState } from 'react';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import { EmbyCheckbox, EmbySelect } from '../../elements';
import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';

export interface ViewSettingsProps {
    open: boolean;
    onClose: () => void;
    settings: any;
    settingsKey: string;
    visibleSettings: string[];
    onSave?: () => void;
}

const ViewSettingsDialog: React.FC<ViewSettingsProps> = ({ 
    open, 
    onClose, 
    settings, 
    settingsKey, 
    visibleSettings,
    onSave 
}) => {
    const [localSettings, setLocalSettings] = useState({ ...settings });
    const [imageType, setImageType] = useState(settings.imageType || 'primary');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        visibleSettings.forEach(key => {
            if (localSettings[key] !== undefined) {
                (userSettings as any).set(`${settingsKey}-${key}`, localSettings[key]);
            }
        });
        (userSettings as any).set(`${settingsKey}-imageType`, imageType);
        onSave?.();
        onClose();
    };

    const toggleSetting = (key: string) => {
        setLocalSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    const showDetails = imageType !== 'list' && imageType !== 'banner';

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog component="form" onSubmit={handleSave} sx={{ minWidth: 400 }}>
                <DialogTitle>{globalize.translate('Settings')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <EmbySelect
                            label={globalize.translate('LabelImageType')}
                            value={imageType}
                            onChange={(_: any, val: any) => setImageType(val)}
                            options={[
                                { label: globalize.translate('Primary'), value: 'primary' },
                                { label: globalize.translate('Thumb'), value: 'thumb' },
                                { label: globalize.translate('Banner'), value: 'banner' },
                                { label: globalize.translate('List'), value: 'list' }
                            ]}
                        />
                        {visibleSettings.includes('showTitle') && showDetails && (
                            <EmbyCheckbox
                                label={globalize.translate('LabelShowTitle')}
                                checked={localSettings.showTitle}
                                onChange={() => toggleSetting('showTitle')}
                            />
                        )}
                        {visibleSettings.includes('showYear') && showDetails && (
                            <EmbyCheckbox
                                label={globalize.translate('LabelShowYear')}
                                checked={localSettings.showYear}
                                onChange={() => toggleSetting('showYear')}
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button type="submit">{globalize.translate('Save')}</Button>
                    <Button variant="plain" color="neutral" onClick={onClose}>{globalize.translate('ButtonCancel')}</Button>
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
};

export default ViewSettingsDialog;
