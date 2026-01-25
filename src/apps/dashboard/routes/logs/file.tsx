import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import React, { useCallback, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useServerLog } from 'apps/dashboard/features/logs/api/useServerLog';
import { Alert } from 'ui-primitives/Alert';
import { Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Paper } from 'ui-primitives/Paper';
import { Text } from 'ui-primitives/Text';
import { Container } from 'ui-primitives/Container';
import Toast from 'apps/dashboard/components/Toast';
import globalize from 'lib/globalize';
import { copy } from 'scripts/clipboard';

const ContentCopyIcon = (): React.ReactElement => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/>
    </svg>
);

const FileDownloadIcon = (): React.ReactElement => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'/>
    </svg>
);

export const Component = (): React.ReactElement => {
    const { file: fileName } = useParams({ strict: false }) as { file?: string };
    const {
        isError: error,
        isPending: loading,
        data: log,
        refetch
    } = useServerLog(fileName ?? '');
    const [ isCopiedToastOpen, setIsCopiedToastOpen ] = useState(false);

    const retry = useCallback(() => refetch(), [refetch]);

    const handleToastClose = useCallback(() => {
        setIsCopiedToastOpen(false);
    }, []);

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
            <Container className='content-primary' style={{ maxWidth: 'none' }}>
                <Flex style={{ flexDirection: 'column', gap: '16px' }}>
                    <Text as='h1' size='xl' weight='bold'>{fileName}</Text>

                    {error && (
                        <Alert
                            variant='error'
                            style={{ marginTop: '16px' }}
                            action={
                                <Button
                                    variant='ghost'
                                    size='sm'
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
                            <Flex style={{ gap: '8px', marginTop: '16px' }}>
                                <Button
                                    startDecorator={<ContentCopyIcon />}
                                    onClick={copyToClipboard}
                                >
                                    {globalize.translate('Copy')}
                                </Button>
                                <Button
                                    startDecorator={<FileDownloadIcon />}
                                    onClick={downloadFile}
                                >
                                    {globalize.translate('Download')}
                                </Button>
                            </Flex>

                            <Paper>
                                <code>
                                    <pre style={{
                                        overflow: 'auto',
                                        margin: 0,
                                        padding: '16px',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {log}
                                    </pre>
                                </code>
                            </Paper>
                        </>
                    )}
                </Flex>
            </Container>
        </Page>
    );
};

Component.displayName = 'LogPage';
