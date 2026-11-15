import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import globalize from 'lib/globalize';
import {
    type TranscodeTestRequest,
    useStartTranscodeTest,
    useStopTranscodeTest,
    useTranscodeTest
} from '../api/useTranscodeTest';
import { isTranscodeTestAccessError, startErrorMessage } from '../utils/transcodeTest';
import CompatibilityCheck from './CompatibilityCheck';
import StressTest from './StressTest';

/** The compatibility check and stress test at the bottom of the Transcoding page. Only one runs at a time. */
const TranscodeTest: FC = () => {
    const [ stopExpectation, setStopExpectation ] = useState<'Idle' | 'Finished'>();
    const stopStatusUpdate = useRef(0);
    const statusQuery = useTranscodeTest(!!stopExpectation);
    const { data: status, dataUpdatedAt, isError: statusError, isFetching, isFetched, refetch } = statusQuery;
    const startTest = useStartTranscodeTest();
    const stopTest = useStopTranscodeTest();
    const isStopping = !!stopExpectation;
    const isBusy = status?.State === 'Running' || startTest.isPending || isStopping || !isFetched || statusError;
    const startError = startTest.isError ? startErrorMessage(startTest.error) : undefined;
    let startErrorText = globalize.translate('TranscodingTestStartError');
    if (isTranscodeTestAccessError(startTest.error)) {
        startErrorText = globalize.translate('TranscodingTestAccessError');
    } else if (startError) {
        startErrorText = globalize.translate('TranscodingTestStartErrorServer', startError);
    }

    useEffect(() => {
        // DELETE only requests cancellation. A fresh GET must confirm it before controls become available.
        const confirmed = stopExpectation === 'Idle' ? status?.State === 'Idle' : status?.State !== 'Running';
        if (stopExpectation && stopTest.isSuccess && !statusError && !isFetching
            && dataUpdatedAt > stopStatusUpdate.current && status && confirmed) {
            setStopExpectation(undefined);
        }
    }, [ stopExpectation, stopTest.isSuccess, statusError, isFetching, dataUpdatedAt, status ]);

    const onStartCompatibility = useCallback(() => {
        stopTest.reset();
        startTest.mutate({ Kind: 'Compatibility' });
    }, [ startTest, stopTest ]);

    const onStartStress = useCallback((request: TranscodeTestRequest) => {
        stopTest.reset();
        startTest.mutate(request);
    }, [ startTest, stopTest ]);

    // Stops a running test; once it has ended, clears its results.
    const onStop = useCallback(() => {
        stopStatusUpdate.current = dataUpdatedAt;
        setStopExpectation(status?.State === 'Running' ? 'Finished' : 'Idle');
        stopTest.mutate(undefined, {
            onError: () => setStopExpectation(undefined)
        });
    }, [ stopTest, dataUpdatedAt, status?.State ]);

    const onRetryStatus = useCallback(() => {
        void refetch();
    }, [ refetch ]);

    return (
        <Stack spacing={4} sx={{ mt: 6 }}>
            <Divider />
            {statusError && (
                <Alert severity='error' action={
                    <Button color='inherit' onClick={onRetryStatus} disabled={isFetching}>
                        {globalize.translate('Retry')}
                    </Button>
                }>
                    {globalize.translate(isTranscodeTestAccessError(statusQuery.error) ?
                        'TranscodingTestAccessError' : 'TranscodingTestStatusError')}
                </Alert>
            )}
            {startTest.isError && (
                <Alert severity='error'>
                    {startErrorText}
                </Alert>
            )}
            {stopTest.isError && (
                <Alert severity='error' action={
                    <Button color='inherit' onClick={onStop} disabled={isStopping}>
                        {globalize.translate('Retry')}
                    </Button>
                }>
                    {globalize.translate(isTranscodeTestAccessError(stopTest.error) ?
                        'TranscodingTestAccessError' : 'TranscodingTestStopError')}
                </Alert>
            )}
            {isStopping && (
                <Alert severity='info' role='status' aria-live='polite'>
                    {globalize.translate('TranscodingTestStopping')}
                </Alert>
            )}
            <CompatibilityCheck status={status} isBusy={isBusy} isStopping={isStopping} onStart={onStartCompatibility} onStop={onStop} onClear={onStop} />
            <Divider />
            <StressTest status={status} isBusy={isBusy} isStopping={isStopping} onStart={onStartStress} onStop={onStop} onClear={onStop} />
        </Stack>
    );
};

export default TranscodeTest;
