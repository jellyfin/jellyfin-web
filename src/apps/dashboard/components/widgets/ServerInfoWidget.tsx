import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Button from '@mui/joy/Button';
import Skeleton from '@mui/joy/Skeleton';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useSystemInfo } from 'hooks/useSystemInfo';

type ServerInfoWidgetProps = {
    onScanLibrariesClick?: () => void;
    onRestartClick?: () => void;
    onShutdownClick?: () => void;
    isScanning?: boolean;
};

const ServerInfoWidget = ({
    onScanLibrariesClick,
    onRestartClick,
    onShutdownClick,
    isScanning
}: ServerInfoWidgetProps) => {
    const { data: systemInfo, isPending } = useSystemInfo();

    return (
        <Widget
            title={globalize.translate('TabServer')}
            href='/dashboard/settings'
        >
            <Stack spacing={3}>
                <Sheet
                    variant="outlined"
                    sx={{
                        p: 2,
                        borderRadius: 'md',
                        bgcolor: 'background.surface'
                    }}
                >
                    <Stack direction='row' spacing={2}>
                        <Stack spacing={1.5} sx={{ minWidth: 140 }}>
                            <Typography level="body-sm" fontWeight="bold">{globalize.translate('LabelServerName')}</Typography>
                            <Typography level="body-sm" fontWeight="bold">{globalize.translate('LabelServerVersion')}</Typography>
                            <Typography level="body-sm" fontWeight="bold">{globalize.translate('LabelWebVersion')}</Typography>
                            <Typography level="body-sm" fontWeight="bold">{globalize.translate('LabelBuildVersion')}</Typography>
                        </Stack>
                        <Stack spacing={1.5} flexGrow={1}>
                            {isPending ? (
                                <>
                                    <Skeleton variant="text" width="80%" />
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="text" width="70%" />
                                    <Skeleton variant="text" width="50%" />
                                </>
                            ) : (
                                <>
                                    <Typography level="body-sm">{systemInfo?.ServerName}</Typography>
                                    <Typography level="body-sm">{systemInfo?.Version}</Typography>
                                    <Typography level="body-sm">{__PACKAGE_JSON_VERSION__}</Typography>
                                    <Typography level="body-sm">{__JF_BUILD_VERSION__}</Typography>
                                </>
                            )}
                        </Stack>
                    </Stack>
                </Sheet>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                        onClick={onScanLibrariesClick}
                        startDecorator={<RefreshIcon />}
                        disabled={isScanning}
                        loading={isScanning}
                        sx={{ flex: 1 }}
                    >
                        {globalize.translate('ButtonScanAllLibraries')}
                    </Button>

                    <Button
                        onClick={onRestartClick}
                        startDecorator={<RestartAltIcon />}
                        color='danger'
                        variant="soft"
                        sx={{ flex: 1 }}
                    >
                        {globalize.translate('Restart')}
                    </Button>

                    <Button
                        onClick={onShutdownClick}
                        startDecorator={<PowerSettingsNewIcon />}
                        color='danger'
                        variant="soft"
                        sx={{ flex: 1 }}
                    >
                        {globalize.translate('ButtonShutdown')}
                    </Button>
                </Stack>
            </Stack>
        </Widget>
    );
};

export default ServerInfoWidget;