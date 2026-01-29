import { useSystemStorage } from 'apps/dashboard/features/storage/api/useSystemStorage';
import StorageListItem from 'apps/dashboard/features/storage/components/StorageListItem';
import globalize from 'lib/globalize';
import React from 'react';
import { List, ListItem } from 'ui-primitives';
import Widget from './Widget';

const ServerPathWidget = (): React.ReactElement => {
    const { data: systemStorage } = useSystemStorage();

    return (
        <Widget title={globalize.translate('HeaderPaths')} href="/dashboard/settings">
            <List>
                <ListItem disablePadding>
                    <StorageListItem
                        label={globalize.translate('LabelCache')}
                        folder={systemStorage?.CacheFolder}
                    />
                </ListItem>
                <ListItem disablePadding>
                    <StorageListItem
                        label={globalize.translate('LabelImageCache')}
                        folder={systemStorage?.ImageCacheFolder}
                    />
                </ListItem>
                <ListItem disablePadding>
                    <StorageListItem
                        label={globalize.translate('LabelProgramData')}
                        folder={systemStorage?.ProgramDataFolder}
                    />
                </ListItem>
                <ListItem disablePadding>
                    <StorageListItem
                        label={globalize.translate('LabelLogs')}
                        folder={systemStorage?.LogFolder}
                    />
                </ListItem>
                <ListItem disablePadding>
                    <StorageListItem
                        label={globalize.translate('LabelMetadata')}
                        folder={systemStorage?.InternalMetadataFolder}
                    />
                </ListItem>
                <ListItem disablePadding>
                    <StorageListItem
                        label={globalize.translate('LabelTranscodes')}
                        folder={systemStorage?.TranscodingTempFolder}
                    />
                </ListItem>
                <ListItem disablePadding>
                    <StorageListItem
                        label={globalize.translate('LabelWeb')}
                        folder={systemStorage?.WebFolder}
                    />
                </ListItem>
            </List>
        </Widget>
    );
};

export default ServerPathWidget;
