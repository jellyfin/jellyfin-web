import React from 'react';
import ContentCopy from '@mui/icons-material/ContentCopy';
import FileDownload from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import globalize from 'lib/globalize';

interface LogButtonGroupProps {
    copyToClipboard: () => void;
    downloadFile: () => void;
    toggleWatchMode: () => void;
    isWatchModeEnabled: boolean;
}

const LogButtonGroup = ({
    copyToClipboard,
    downloadFile,
    toggleWatchMode,
    isWatchModeEnabled
}: LogButtonGroupProps) => (
    <ButtonGroup variant='contained' sx={{ mt: 2 }}>
        <Button
            startIcon={<ContentCopy />}
            onClick={copyToClipboard}
        >
            {globalize.translate('Copy')}
        </Button>
        <Button
            startIcon={<FileDownload />}
            onClick={downloadFile}
        >
            {globalize.translate('Download')}
        </Button>
        <Button
            startIcon={isWatchModeEnabled ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={toggleWatchMode}
        >
            {isWatchModeEnabled ? globalize.translate('Unwatch') : globalize.translate('Watch')}
        </Button>
    </ButtonGroup>
);

export default LogButtonGroup;
