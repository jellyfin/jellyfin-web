import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useServerLog } from 'apps/dashboard/features/logs/api/useServerLog';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ContentCopy from '@mui/icons-material/ContentCopy';
import FileDownload from '@mui/icons-material/FileDownload';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';
import { copy } from 'scripts/clipboard';

export const Component = () => {
    const { file: fileName } = useParams();
    const {
        isError: error,
        isPending: loading,
        data: log,
        refetch
    } = useServerLog(fileName ?? '');

    const retry = useCallback(() => refetch(), [refetch]);

    const copyToClipboard = useCallback(async () => {
        if (log) {
            await copy(log);
            toast({ text: globalize.translate('CopyLogSuccess') });
        }
    }, [log]);

    const downloadFile = useCallback(() => {
        if ('URL' in globalThis && log && fileName) {
            const blob = new Blob([log], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        }
    }, [log, fileName]);

    return (
        <Page
            id='logPage'
            title={fileName}
            className='mainAnimatedPage type-interior'
        >
            <Container className='content-primary'>
                <Box>
                    <Typography variant='h1'>{fileName}</Typography>

                    {error && (
                        <Alert
                            key='error'
                            severity='error'
                            sx={{ mt: 2 }}
                            action={
                                <Button
                                    color='inherit'
                                    size='small'
                                    onClick={retry}
                                >
                                    {globalize.translate('Retry')}
                                </Button>
                            }
                        >
                            {globalize.translate('LogLoadFailure')}
                        </Alert>
                    )}

                    {loading && <Loading />}

                    {!error && !loading && (
                        <>
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
                            </ButtonGroup>

                            <Paper sx={{ mt: 2 }}>
                                <code>
                                    <pre
                                        style={{
                                            overflow: 'auto',
                                            margin: 0,
                                            padding: '16px'
                                        }}
                                    >
                                        {log}
                                    </pre>
                                </code>
                            </Paper>
                        </>
                    )}
                </Box>
            </Container>
        </Page>
    );
};

Component.displayName = 'LogPage';
