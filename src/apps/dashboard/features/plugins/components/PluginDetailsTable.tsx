import React, { type FC } from 'react';
import { Paper } from 'ui-primitives/Paper';
import { Table, TableBody, TableRow, TableCell, TableHead } from 'ui-primitives/Table';
import { Skeleton } from 'ui-primitives/Skeleton';
import { Text } from 'ui-primitives/Text';
import { Flex } from 'ui-primitives/Box';

import globalize from 'lib/globalize';
import type { PluginDetails } from '../types/PluginDetails';

const getStatusText = (pluginDetails?: PluginDetails): string => {
    if (pluginDetails == null) return '';
    if (pluginDetails.status != null) return pluginDetails.status;
    return globalize.translate('LabelNotInstalled');
};

const getVersionText = (pluginDetails?: PluginDetails): string => {
    return pluginDetails?.version?.version ?? '';
};

const getOwnerText = (pluginDetails?: PluginDetails): string => {
    return pluginDetails?.owner ?? globalize.translate('Unknown');
};

const getRepositoryText = (pluginDetails?: PluginDetails): { text: string; url?: string; isBundled: boolean } => {
    if (pluginDetails == null) return { text: globalize.translate('Unknown'), isBundled: false };

    if (pluginDetails.status != null && pluginDetails.canUninstall === false) {
        return { text: globalize.translate('LabelBundled'), isBundled: true };
    }

    if (pluginDetails.version?.repositoryUrl != null) {
        return {
            text: pluginDetails.version.repositoryName ?? '',
            url: pluginDetails.version.repositoryUrl,
            isBundled: false
        };
    }

    return { text: globalize.translate('Unknown'), isBundled: false };
};

interface PluginDetailsTableProps {
    isPluginLoading: boolean;
    isRepositoryLoading: boolean;
    pluginDetails?: PluginDetails;
}

const PluginDetailsTable: FC<PluginDetailsTableProps> = ({
    isPluginLoading,
    isRepositoryLoading,
    pluginDetails
}): React.ReactElement => (
    <Paper>
        <Table>
            <TableBody>
                <TableRow>
                    <TableHead>
                        <Text as="span" size="sm" color="secondary">
                            {globalize.translate('LabelStatus')}
                        </Text>
                    </TableHead>
                    <TableCell>
                        {isPluginLoading ? (
                            <Skeleton width={100} height={20} />
                        ) : (
                            <Text as="span">{getStatusText(pluginDetails)}</Text>
                        )}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableHead>
                        <Text as="span" size="sm" color="secondary">
                            {globalize.translate('LabelVersion')}
                        </Text>
                    </TableHead>
                    <TableCell>
                        {isPluginLoading ? (
                            <Skeleton width={80} height={20} />
                        ) : (
                            <Text as="span">{getVersionText(pluginDetails)}</Text>
                        )}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableHead>
                        <Text as="span" size="sm" color="secondary">
                            {globalize.translate('LabelDeveloper')}
                        </Text>
                    </TableHead>
                    <TableCell>
                        {isRepositoryLoading ? (
                            <Skeleton width={120} height={20} />
                        ) : (
                            <Text as="span">{getOwnerText(pluginDetails)}</Text>
                        )}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableHead>
                        <Text as="span" size="sm" color="secondary">
                            {globalize.translate('LabelRepository')}
                        </Text>
                    </TableHead>
                    <TableCell>
                        {isRepositoryLoading ? (
                            <Skeleton width={100} height={20} />
                        ) : (
                            (() => {
                                const repo = getRepositoryText(pluginDetails);
                                if (repo.isBundled) {
                                    return <Text as="span">{repo.text}</Text>;
                                }
                                if (repo.url != null) {
                                    return (
                                        <a
                                            href={repo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'var(--colors-primary)', textDecoration: 'none' }}
                                        >
                                            <Flex style={{ alignItems: 'center', gap: '4px' }}>
                                                <Text as="span">{repo.text}</Text>
                                            </Flex>
                                        </a>
                                    );
                                }
                                return <Text as="span">{repo.text}</Text>;
                            })()
                        )}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </Paper>
);

export default PluginDetailsTable;
