import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useServerLog } from 'apps/dashboard/features/logs/api/useServerLog';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import { copy } from 'scripts/clipboard';
import Toast from 'apps/dashboard/components/Toast';
import LogButtonGroup from 'apps/dashboard/features/logs/components/LogButtonGroup';

export const Component = () => {
    const { file: fileName } = useParams();
    const contentPrimaryRef = useRef<HTMLDivElement | null>(null);
    const [ isCopiedToastOpen, setIsCopiedToastOpen ] = useState(false);
    const [ isWatchModeEnabled, setIsWatchModeEnabled ] = useState(false);
    const [ wasAtBottom, setWasAtBottom ] = useState<boolean>(false);
    const {
        isError: error,
        isPending: loading,
        data: log,
        refetch
    } = useServerLog(
        fileName ?? '',
        isWatchModeEnabled ? 2000 : false
    );

    const retry = useCallback(() => refetch(), [refetch]);

    const handleToastClose = useCallback(() => {
        setIsCopiedToastOpen(false);
    }, []);

    const scrollToBottom = useCallback(() => {
        const bottomHeight = contentPrimaryRef.current?.scrollHeight;

        if (bottomHeight) {
            window.scrollTo(0, bottomHeight);
        }
    }, []);

    const toggleWatchMode = useCallback(() => {
        const newWatchMode = !isWatchModeEnabled;
        setIsWatchModeEnabled(newWatchMode);

        if (newWatchMode) {
            scrollToBottom();
        }
    }, [isWatchModeEnabled, scrollToBottom]);

    const copyToClipboard = useCallback(async () => {
        if (log) {
            await copy(log);
            setIsCopiedToastOpen(true);
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

    useEffect(() => {
        const onScroll = () => {
            if (contentPrimaryRef.current) {
                const isAtBottom = window.innerHeight + Math.round(window.scrollY) >= contentPrimaryRef.current.offsetHeight;
                setWasAtBottom(isAtBottom);
            }
        };

        document.addEventListener('scroll', onScroll);

        return () => {
            document.removeEventListener('scroll', onScroll);
        };
    }, []);

    useEffect(() => {
        if (wasAtBottom) {
            scrollToBottom();
        }
    }, [ log, scrollToBottom, wasAtBottom ]);

    return (
        <Page
            id='logPage'
            title={fileName}
            className='mainAnimatedPage type-interior'
        >
            <Toast
                open={isCopiedToastOpen}
                onClose={handleToastClose}
                message={globalize.translate('CopyLogSuccess')}
            />
            <Container
                className='content-primary'
                maxWidth={false}
                ref={contentPrimaryRef}
            >
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
                            <LogButtonGroup
                                copyToClipboard={copyToClipboard}
                                downloadFile={downloadFile}
                                toggleWatchMode={toggleWatchMode}
                                isWatchModeEnabled={isWatchModeEnabled}
                            />

                            <Paper sx={{ mt: 2 }}>
                                <code>
                                    <pre style={{
                                        overflow:'auto',
                                        margin: 0,
                                        padding: '16px',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {log}
                                    </pre>
                                </code>
                            </Paper>

                            <LogButtonGroup
                                copyToClipboard={copyToClipboard}
                                downloadFile={downloadFile}
                                toggleWatchMode={toggleWatchMode}
                                isWatchModeEnabled={isWatchModeEnabled}
                            />
                        </>
                    )}
                </Box>
            </Container>
        </Page>
    );
};

Component.displayName = 'LogPage';
