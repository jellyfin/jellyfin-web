import * as DialogPrimitive from '@radix-ui/react-dialog';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { vars } from 'styles/tokens.css.ts';
import { Button, Checkbox, Flex, SelectInput } from 'ui-primitives';
import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import * as styles from './viewSettings.css.ts';

interface ViewSettingsOptions {
    settingsKey: string;
    settings: Record<string, boolean | string>;
    visibleSettings: string[];
}

interface ViewSettingsDialogProps extends ViewSettingsOptions {
    onClose: (saved: boolean) => void;
}

function ViewSettingsDialogContent({
    settingsKey,
    settings,
    visibleSettings,
    onClose
}: ViewSettingsDialogProps) {
    const [imageType, setImageType] = useState((settings.imageType as string) || 'primary');
    const [showTitle, setShowTitle] = useState((settings.showTitle as boolean) || false);
    const [showYear, setShowYear] = useState((settings.showYear as boolean) || false);
    const [groupBySeries, setGroupBySeries] = useState(
        (settings.groupBySeries as boolean) || false
    );

    const showDetails = imageType !== 'list' && imageType !== 'banner';

    const handleSave = () => {
        if (visibleSettings.includes('imageType')) {
            userSettings.set(`${settingsKey}-imageType`, imageType);
        }
        if (visibleSettings.includes('showTitle')) {
            userSettings.set(`${settingsKey}-showTitle`, showTitle);
        }
        if (visibleSettings.includes('showYear')) {
            userSettings.set(`${settingsKey}-showYear`, showYear);
        }
        if (visibleSettings.includes('groupBySeries')) {
            userSettings.set(`${settingsKey}-groupBySeries`, groupBySeries);
        }
        onClose(true);
    };

    return (
        <DialogPrimitive.Root open onOpenChange={() => onClose(false)}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className={styles.overlay} />
                <DialogPrimitive.Content className={styles.content}>
                    <DialogPrimitive.Title className={styles.title}>
                        {globalize.translate('Settings')}
                    </DialogPrimitive.Title>

                    <Flex direction="column" gap={vars.spacing['5']}>
                        {visibleSettings.includes('imageType') && (
                            <SelectInput
                                label={globalize.translate('LabelImageType')}
                                value={imageType}
                                onChange={(e) => setImageType(e.target.value)}
                            >
                                <option value="primary">{globalize.translate('Primary')}</option>
                                <option value="banner">{globalize.translate('Banner')}</option>
                                <option value="disc">{globalize.translate('Disc')}</option>
                                <option value="logo">{globalize.translate('Logo')}</option>
                                <option value="thumb">{globalize.translate('Thumb')}</option>
                                <option value="list">{globalize.translate('List')}</option>
                            </SelectInput>
                        )}

                        {visibleSettings.includes('showTitle') && showDetails && (
                            <Checkbox
                                checked={showTitle}
                                onChange={(e) => setShowTitle(e.target.checked)}
                            >
                                {globalize.translate('ShowTitle')}
                            </Checkbox>
                        )}

                        {visibleSettings.includes('showYear') && showDetails && (
                            <Checkbox
                                checked={showYear}
                                onChange={(e) => setShowYear(e.target.checked)}
                            >
                                {globalize.translate('ShowYear')}
                            </Checkbox>
                        )}

                        {visibleSettings.includes('groupBySeries') && (
                            <Checkbox
                                checked={groupBySeries}
                                onChange={(e) => setGroupBySeries(e.target.checked)}
                            >
                                {globalize.translate('GroupBySeries')}
                            </Checkbox>
                        )}
                    </Flex>

                    <div className={styles.footer}>
                        <Button variant="secondary" onClick={() => onClose(false)}>
                            {globalize.translate('ButtonCancel')}
                        </Button>
                        <Button onClick={handleSave}>{globalize.translate('Save')}</Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

class ViewSettings {
    show(options: ViewSettingsOptions): Promise<void> {
        return new Promise((resolve) => {
            const container = document.createElement('div');
            container.id = 'viewSettingsDialogContainer';
            document.body.appendChild(container);
            const root = createRoot(container);

            const handleClose = () => {
                root.unmount();
                container.remove();
                resolve();
            };

            root.render(
                <ViewSettingsDialogContent
                    settingsKey={options.settingsKey}
                    settings={options.settings}
                    visibleSettings={options.visibleSettings}
                    onClose={handleClose}
                />
            );
        });
    }
}

export default ViewSettings;
