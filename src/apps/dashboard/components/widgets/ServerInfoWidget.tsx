import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import type { SystemInfo } from '@jellyfin/sdk/lib/generated-client/models';
import Skeleton from '@mui/material/Skeleton';
import { useSystemInfo } from 'hooks/useSystemInfo';

type IProps = {
    systemInfo?: SystemInfo;
    onScanLibrariesClick?: () => void;
    onRestartClick?: () => void;
    onShutdownClick?: () => void;
};

const ServerInfoWidget = ({ onScanLibrariesClick, onRestartClick, onShutdownClick }: IProps) => {
    const { data: systemInfo, isPending } = useSystemInfo();

    return (
        <Widget
            title={globalize.translate('TabServer')}
            href='/dashboard/settings'
        >
            <Stack spacing={2}>
                <Paper sx={{
                    padding: 2
                }}>
                    <Stack direction='row'>
                        <Stack flexGrow={1} gap={1}>
                            <Typography fontWeight='bold'>{globalize.translate('LabelServerName')}</Typography>
                            <Typography fontWeight='bold'>{globalize.translate('LabelServerVersion')}</Typography>
                            <Typography fontWeight='bold'>{globalize.translate('LabelWebVersion')}</Typography>
                            <Typography fontWeight='bold'>{globalize.translate('LabelBuildVersion')}</Typography>
                        </Stack>
                        <Stack flexGrow={5} gap={1}>
                            {isPending ? (
                                <>
                                    <Skeleton />
                                    <Skeleton />
                                    <Skeleton />
                                    <Skeleton />
                                </>
                            ) : (
                                <>
                                    <Typography>{systemInfo?.ServerName}</Typography>
                                    <Typography>{systemInfo?.Version}</Typography>
                                    <Typography>{__PACKAGE_JSON_VERSION__}</Typography>
                                    <Typography>{__JF_BUILD_VERSION__}</Typography>
                                </>
                            )}
                        </Stack>
                    </Stack>
                </Paper>

                <Stack direction='row' gap={1.5} flexWrap={'wrap'}>
                    <Button
                        onClick={onScanLibrariesClick}
                        sx={{
                            fontWeight: 'bold'
                        }}
                    >
                        {globalize.translate('ButtonScanAllLibraries')}
                    </Button>

                    <Button
                        onClick={onRestartClick}
                        color='error'
                        sx={{
                            fontWeight: 'bold'
                        }}
                    >
                        {globalize.translate('Restart')}
                    </Button>

                    <Button
                        onClick={onShutdownClick}
                        color='error'
                        sx={{
                            fontWeight: 'bold'
                        }}
                    >
                        {globalize.translate('ButtonShutdown')}
                    </Button>
                </Stack>
            </Stack>
        </Widget>
    );
};

export default ServerInfoWidget;
