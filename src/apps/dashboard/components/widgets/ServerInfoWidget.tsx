import { getDisplayVersion } from '@jellyfin/sdk/lib/utils/versioning';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Skeleton from '@mui/material/Skeleton';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CleaningServices from '@mui/icons-material/CleaningServices';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import React from 'react';

import { useSystemInfo } from 'hooks/useSystemInfo';
import globalize from 'lib/globalize';

import Widget from './Widget';

type ServerInfoWidgetProps = {
    onScanLibrariesClick?: () => void;
    onRestartClick?: () => void;
    onShutdownClick?: () => void;
    onClearQueues?: () => void | Promise<void>;
    isScanning?: boolean;
};

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
};

const ServerInfoWidget = ({
    onScanLibrariesClick,
    onRestartClick,
    onShutdownClick,
    onClearQueues,
    isScanning
}: ServerInfoWidgetProps) => {
    const { data: systemInfo, isPending } = useSystemInfo();

    const displayServerVersion = getDisplayVersion(systemInfo?.Version);
    const displayWebVersion = getDisplayVersion(__PACKAGE_JSON_VERSION__);

    const [open, setOpen] = React.useState(false);
    const handleModalOpen = () => setOpen(true);
    const handleModalClose = () => setOpen(false);

    const onClearQueuesHandler = async () => {
        await onClearQueues?.();
        handleModalClose();
    };

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
                            <>
                                {isPending ? (
                                    <>
                                        <Skeleton />
                                        <Skeleton />
                                    </>
                                ) : (
                                    <>
                                        <Typography>{systemInfo?.ServerName}</Typography>
                                        <Typography>{displayServerVersion}</Typography>
                                    </>
                                )}
                                <Typography>{displayWebVersion}</Typography>
                                <Typography>{__JF_BUILD_VERSION__}</Typography>
                            </>
                        </Stack>
                    </Stack>
                </Paper>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                >
                    <Button
                        onClick={onScanLibrariesClick}
                        startIcon={<RefreshIcon />}
                        sx={{
                            fontWeight: 'bold'
                        }}
                        loading={isScanning}
                        loadingPosition='start'
                    >
                        {globalize.translate('ButtonScanAllLibraries')}
                    </Button>

                    <Button
                        onClick={handleModalOpen}
                        startIcon={<CleaningServices />}
                        sx={{
                            fontWeight: 'bold'
                        }}
                    >
                        Clear Queues
                    </Button>
                    <Modal
                        open={open}
                        onClose={handleModalClose}
                        aria-labelledby='modal-modal-title'
                        aria-describedby='modal-modal-description'
                    >
                        <Box sx={style}>
                            <Typography id='modal-modal-title' variant='h6' component='h2'>
                                Clear Queues
                            </Typography>
                            <Typography id='modal-modal-description' sx={{ mt: 2 }}>
                                Are you sure you would like to clear the Continue Watching queue? This action cannot be undone.
                            </Typography>
                            <Button
                                onClick={handleModalClose}
                                sx={{
                                    fontWeight: 'bold'
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onClearQueuesHandler}
                                startIcon={<CleaningServices />}
                                color='error'
                                sx={{
                                    fontWeight: 'bold'
                                }}
                            >
                                Clear
                            </Button>
                        </Box>
                    </Modal>

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
