import List from '@mui/material/List';
import React from 'react';

import { useSystemStorage } from 'apps/dashboard/features/storage/api/useSystemStorage';
import StorageListItem from 'apps/dashboard/features/storage/components/StorageListItem';
import globalize from 'lib/globalize';
import Widget from './Widget';

const ServerPathWidget = () => {
    const { data: systemStorage } = useSystemStorage();

    return (
        <Widget
            title={globalize.translate('HeaderPaths')}
            // NOTE: We should use a react-router Link component, but components rendered in legacy views lack the
            // routing context
            href='#/dashboard/settings'
        >
            <List sx={{ bgcolor: 'background.paper' }}>
                <StorageListItem
                    label={globalize.translate('LabelCache')}
                    folder={systemStorage?.CacheFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelImageCache')}
                    folder={systemStorage?.ImageCacheFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelProgramData')}
                    folder={systemStorage?.ProgramDataFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelLogs')}
                    folder={systemStorage?.LogFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelMetadata')}
                    folder={systemStorage?.InternalMetadataFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelTranscodes')}
                    folder={systemStorage?.TranscodingTempFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelWeb')}
                    folder={systemStorage?.WebFolder}
                />
            </List>
        </Widget>
    );
};

export default ServerPathWidget;
