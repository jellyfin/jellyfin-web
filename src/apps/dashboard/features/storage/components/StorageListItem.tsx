import { vars } from 'styles/tokens.css.ts';

import type { FolderStorageDto } from '@jellyfin/sdk/lib/generated-client';
import React, { type FC } from 'react';
import { Progress } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Skeleton } from 'ui-primitives';

import globalize from 'lib/globalize';
import { getReadableSize } from 'utils/file';

import { StorageType } from '../constants/StorageType';
import { calculateTotal, calculateUsedPercentage } from '../utils/space';

import StorageTypeIcon from './StorageTypeIcon';

interface StorageListItemProps {
    label: string;
    folder?: FolderStorageDto;
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

const StorageListItem: FC<StorageListItemProps> = ({ label, folder }) => {
    const readableUsedSpace =
        typeof folder?.UsedSpace === 'undefined' || folder.UsedSpace < 0 ? '?' : getReadableSize(folder.UsedSpace);
    const totalSpace = calculateTotal(folder);
    const readableTotalSpace = totalSpace < 0 ? '?' : getReadableSize(totalSpace);
    const usedPercentage = calculateUsedPercentage(folder);
    const statusColor = folder ? getStatusColor(usedPercentage) : 'primary';

    return (
        <Flex style={{ alignItems: 'center', gap: vars.spacing['4'], padding: '12px 0' }}>
            <div title={getStorageTypeText(folder?.StorageType)}>
                <StorageTypeIcon type={folder?.StorageType} />
            </div>
            <Flex style={{ flex: 1, flexDirection: 'column', gap: vars.spacing['1'] }}>
                <Text as="span" size="sm" style={{ wordBreak: 'break-all' }}>
                    {label}
                </Text>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['1'] }}>
                    {folder ? (
                        <Text as="span" size="sm" color="secondary" style={{ lineBreak: 'anywhere' }}>
                            {folder.Path}
                        </Text>
                    ) : (
                        <Skeleton width="100%" height={20} />
                    )}
                    <Progress
                        value={usedPercentage}
                        style={{
                            backgroundColor:
                                statusColor === 'error'
                                    ? 'var(--colors-error)'
                                    : statusColor === 'warning'
                                      ? 'var(--colors-warning)'
                                      : undefined
                        }}
                    />
                    <Text as="span" size="sm" color="secondary" style={{ textAlign: 'end' }}>
                        {`${readableUsedSpace} / ${readableTotalSpace}`}
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default StorageListItem;
