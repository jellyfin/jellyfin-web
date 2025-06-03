import type { FolderStorageDto } from '@jellyfin/sdk/lib/generated-client';
import LinearProgress from '@mui/material/LinearProgress';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';
import { getReadableSize } from 'utils/file';

import { StorageType } from '../constants/StorageType';

import StorageTypeIcon from './StorageTypeIcon';

interface StorageListItemProps {
    label: string
    folder?: FolderStorageDto
}

const calculateUsed = (folder?: FolderStorageDto) => {
    if (typeof folder?.UsedSpace === 'undefined') return 0;
    if (typeof folder.FreeSpace === 'undefined') return 100;

    return folder.UsedSpace / (folder.FreeSpace + folder.UsedSpace) * 100;
};

const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'error';
    if (percent >= 80) return 'warning';
    return 'success';
};

const getStorageTypeText = (type?: string | null) => {
    if (!type) return undefined;

    if (Object.keys(StorageType).includes(type)) {
        return globalize.translate(`StorageType.${type}`);
    }

    return type;
};

const StorageListItem: FC<StorageListItemProps> = ({
    label,
    folder
}) => {
    const usedSpace = (typeof folder?.UsedSpace === 'undefined') ? '?' : getReadableSize(folder.UsedSpace);
    const totalSpace = (typeof folder?.FreeSpace === 'undefined' || typeof folder.UsedSpace === 'undefined') ?
        '?' : getReadableSize(folder.FreeSpace + folder.UsedSpace);
    const usedPercent = calculateUsed(folder);
    const statusColor = folder ? getStatusColor(usedPercent) : 'primary';

    return (
        <ListItem>
            <ListItemIcon title={getStorageTypeText(folder?.StorageType)}>
                <StorageTypeIcon type={folder?.StorageType} />
            </ListItemIcon>
            <ListItemText
                primary={
                    <Typography
                        component='span'
                        variant='body2'
                    >
                        {label}
                    </Typography>
                }
                secondary={
                    <>
                        <Typography
                            color='textPrimary'
                            sx={{
                                paddingBottom: 0.5
                            }}
                        >
                            {folder ? folder.Path : (
                                <Skeleton />
                            )}
                        </Typography>
                        <LinearProgress
                            variant={folder ? 'determinate' : 'indeterminate'}
                            color={statusColor}
                            value={usedPercent}
                        />
                        <Typography
                            variant='body2'
                            color='textSecondary'
                            sx={{
                                textAlign: 'end'
                            }}
                        >
                            {`${usedSpace} / ${totalSpace}`}
                        </Typography>
                    </>
                }
                slots={{
                    secondary: 'div'
                }}
            />
        </ListItem>
    );
};

export default StorageListItem;
