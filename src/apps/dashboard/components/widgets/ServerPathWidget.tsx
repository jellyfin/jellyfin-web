import List from '@mui/material/List';
import React from 'react';
import StorageListItem from 'apps/dashboard/features/storage/components/StorageListItem';
import globalize from 'lib/globalize';
import Widget from './Widget';
import type { SystemStorageDto } from '@jellyfin/sdk/lib/generated-client/models/system-storage-dto';

type IProps = {
    systemStorage?: SystemStorageDto;
};

const ServerPathWidget = ({ systemStorage }: IProps) => {
    return (
        <Widget
            title={globalize.translate('HeaderPaths')}
            href='/dashboard/settings'
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
