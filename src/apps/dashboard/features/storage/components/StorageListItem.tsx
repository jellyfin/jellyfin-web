import type { FolderStorageDto } from '@jellyfin/sdk/lib/generated-client';
import LinearProgress from '@mui/material/LinearProgress';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';

import globalize from '@/lib/globalize';
import { getReadableSize } from '@/utils/file';

import { StorageType } from '@/apps/dashboard/features/storage/constants/StorageType';
import { calculateTotal, calculateUsedPercentage } from '@/apps/dashboard/features/storage/utils/space';

import StorageTypeIcon from './StorageTypeIcon';

interface StorageListItemProps {
    label: string
    folder?: FolderStorageDto
}

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
    const readableUsedSpace = (typeof folder?.UsedSpace === 'undefined' || folder.UsedSpace < 0) ?
        '?' : getReadableSize(folder.UsedSpace);
    const totalSpace = calculateTotal(folder);
    const readableTotalSpace = (totalSpace < 0) ? '?' : getReadableSize(totalSpace);
    const usedPercentage = calculateUsedPercentage(folder);
    const statusColor = folder ? getStatusColor(usedPercentage) : 'primary';

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
                                paddingBottom: 0.5,
                                lineBreak: 'anywhere'
                            }}
                        >
                            {folder ? folder.Path : (
                                <Skeleton />
                            )}
                        </Typography>
                        <LinearProgress
                            variant={folder ? 'determinate' : 'indeterminate'}
                            color={statusColor}
                            value={usedPercentage}
                        />
                        <Typography
                            variant='body2'
                            color='textSecondary'
                            sx={{
                                textAlign: 'end'
                            }}
                        >
                            {`${readableUsedSpace} / ${readableTotalSpace}`}
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
