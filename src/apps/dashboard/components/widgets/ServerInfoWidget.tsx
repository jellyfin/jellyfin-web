import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useSystemInfo } from 'hooks/useSystemInfo';

type ServerInfoWidgetProps = {
    onScanLibrariesClick?: () => void;
    onRestartClick?: () => void;
    onShutdownClick?: () => void;
};

const ServerInfoWidget = ({ onScanLibrariesClick, onRestartClick, onShutdownClick }: ServerInfoWidgetProps) => {
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
                        <Stack flexGrow={1} spacing={1}>
                            <Typography fontWeight='bold'>{globalize.translate('LabelServerName')}</Typography>
                            <Typography fontWeight='bold'>{globalize.translate('LabelServerVersion')}</Typography>
                            <Typography fontWeight='bold'>{globalize.translate('LabelWebVersion')}</Typography>
                            <Typography fontWeight='bold'>{globalize.translate('LabelBuildVersion')}</Typography>
                        </Stack>
                        <Stack flexGrow={5} spacing={1}>
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

                <Stack direction='row' spacing={1.5}>
                    <Button
                        onClick={onScanLibrariesClick}
                        startIcon={<RefreshIcon />}
                        sx={{
                            fontWeight: 'bold'
                        }}
                    >
                        {globalize.translate('ButtonScanAllLibraries')}
                    </Button>

                    <Button
                        onClick={onRestartClick}
                        startIcon={<RestartAltIcon />}
                        color='error'
                        sx={{
                            fontWeight: 'bold'
                        }}
                    >
                        {globalize.translate('Restart')}
                    </Button>

                    <Button
                        onClick={onShutdownClick}
                        startIcon={<PowerSettingsNewIcon />}
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
