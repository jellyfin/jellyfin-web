import React from 'react';
import { ExitIcon, ReloadIcon, ResetIcon } from '@radix-ui/react-icons';

import { useSystemInfo } from 'hooks/useSystemInfo';
import globalize from 'lib/globalize';
import { Button } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { Paper } from 'ui-primitives';
import { Skeleton } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import Widget from './Widget';

interface ServerInfoWidgetProps {
    onScanLibrariesClick?: () => void;
    onRestartClick?: () => void;
    onShutdownClick?: () => void;
    isScanning?: boolean;
}

const ServerInfoWidget = ({
    onScanLibrariesClick,
    onRestartClick,
    onShutdownClick,
    isScanning
}: ServerInfoWidgetProps): React.ReactElement => {
    const { data: systemInfo, isPending } = useSystemInfo();

    return (
        <Widget title={globalize.translate('TabServer')} href="/dashboard/settings">
            <Flex style={{ flexDirection: 'column', gap: vars.spacing['6'] }}>
                <Paper
                    variant="outlined"
                    style={{
                        padding: vars.spacing['5'],
                        borderRadius: vars.borderRadius.md,
                        backgroundColor: vars.colors.surface
                    }}
                >
                    <Flex style={{ flexDirection: 'row', gap: vars.spacing['5'] }}>
                        <Flex style={{ flexDirection: 'column', gap: vars.spacing['4'], minWidth: 140 }}>
                            <Text size="sm" style={{ fontWeight: vars.typography.fontWeightBold }}>
                                {globalize.translate('LabelServerName')}
                            </Text>
                            <Text size="sm" style={{ fontWeight: vars.typography.fontWeightBold }}>
                                {globalize.translate('LabelServerVersion')}
                            </Text>
                            <Text size="sm" style={{ fontWeight: vars.typography.fontWeightBold }}>
                                {globalize.translate('LabelWebVersion')}
                            </Text>
                            <Text size="sm" style={{ fontWeight: vars.typography.fontWeightBold }}>
                                {globalize.translate('LabelBuildVersion')}
                            </Text>
                        </Flex>
                        <Flex style={{ flexDirection: 'column', gap: vars.spacing['4'], flexGrow: 1 }}>
                            {isPending ? (
                                <>
                                    <Skeleton variant="text" width="80%" />
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="text" width="70%" />
                                    <Skeleton variant="text" width="50%" />
                                </>
                            ) : (
                                <>
                                    <Text size="sm">{systemInfo?.ServerName}</Text>
                                    <Text size="sm">{systemInfo?.Version}</Text>
                                    <Text size="sm">{__PACKAGE_JSON_VERSION__}</Text>
                                    <Text size="sm">{__JF_BUILD_VERSION__}</Text>
                                </>
                            )}
                        </Flex>
                    </Flex>
                </Paper>

                <Flex style={{ flexDirection: 'row', flexWrap: 'wrap', gap: vars.spacing['4'] }}>
                    <Button
                        onClick={onScanLibrariesClick}
                        startDecorator={<ReloadIcon />}
                        disabled={isScanning}
                        loading={isScanning}
                        style={{ flex: 1 }}
                    >
                        {globalize.translate('ButtonScanAllLibraries')}
                    </Button>

                    <Button
                        onClick={onRestartClick}
                        startDecorator={<ResetIcon />}
                        color="danger"
                        variant="soft"
                        style={{ flex: 1 }}
                    >
                        {globalize.translate('Restart')}
                    </Button>

                    <Button
                        onClick={onShutdownClick}
                        startDecorator={<ExitIcon />}
                        color="danger"
                        variant="soft"
                        style={{ flex: 1 }}
                    >
                        {globalize.translate('ButtonShutdown')}
                    </Button>
                </Flex>
            </Flex>
        </Widget>
    );
};

export default ServerInfoWidget;
