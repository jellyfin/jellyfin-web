import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SettingsIcon from '@mui/icons-material/Settings';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

import StorageListItem from 'apps/dashboard/features/storage/components/StorageListItem';
import globalize from 'lib/globalize';
import Widget from './Widget';
import { useSystemStorage } from 'apps/dashboard/features/storage/api/useSystemStorage';
import type { FolderStorageDto } from '@jellyfin/sdk/lib/generated-client';

const ServerPathWidget = () => {
    const { data: systemStorage } = useSystemStorage();
    const [view, setView] = useState<'system' | 'libraries'>('system');

    const handleViewChange = (
        event: React.MouseEvent<HTMLElement>,
        newView: 'system' | 'libraries' | null
    ) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    const libraryDrives = useMemo(() => {
        if (!systemStorage?.Libraries) return [];

        const drivesMap = new Map<string, { label: string; folder: FolderStorageDto }>();

        systemStorage.Libraries.forEach((library) => {
            (library.Folders || []).forEach((folder) => {
                if (folder.Path?.match(/[/\\]data[/\\]collections$/i)) {
                    return;
                }

                const deviceId = folder.DeviceId || folder.Path;
                if (!deviceId) return;

                const libraryName = library.Name || globalize.translate('HeaderLibrary');

                if (drivesMap.has(deviceId)) {
                    const existing = drivesMap.get(deviceId)!;
                    if (!existing.label.includes(libraryName)) {
                        existing.label += `, ${libraryName}`;
                    }
                } else {
                    drivesMap.set(deviceId, {
                        label: libraryName,
                        folder: { ...folder, Path: deviceId }
                    });
                }
            });
        });

        return Array.from(drivesMap.values());
    }, [systemStorage?.Libraries]);

    return (
        <Widget
            title={globalize.translate('HeaderPaths')}
            href='/dashboard/settings'
        >
            <Box sx={{ display: 'flex', justifyContent: 'start', mb: 2 }}>
                <ToggleButtonGroup
                    value={view}
                    exclusive
                    onChange={handleViewChange}
                    aria-label="storage view toggle"
                    size="small"
                >
                    <ToggleButton value="system" aria-label="system paths">
                        <SettingsIcon sx={{ mr: 1, fontSize: 20 }} />
                        {globalize.translate('LabelSystem')}
                    </ToggleButton>
                    <ToggleButton value="libraries" aria-label="library paths">
                        <VideoLibraryIcon sx={{ mr: 1, fontSize: 20 }} />
                        {globalize.translate('Libraries')}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <List sx={{ 
                bgcolor: 'background.paper',
                maxHeight: 450,
                overflowY: 'auto'
                }}
            >
                {view === 'system' ? (
                    <>
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
                    </>
                ) : (
                    libraryDrives.map((library, index) => (
                        <StorageListItem
                            key={library.folder.DeviceId || index}
                            label={library.label}
                            folder={library.folder}
                        />
                    ))
                )}
            </List>
        </Widget>
    );
};

export default ServerPathWidget;