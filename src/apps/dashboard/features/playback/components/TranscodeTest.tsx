import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import globalize from 'lib/globalize';
import {
    type TranscodeTestRequest,
    type TranscodeTestState,
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
    const stopIntent = useRef<'Idle' | 'Finished' | undefined>(undefined);
    const stopRetryVersion = useRef(0);
    const stopStatusUpdate = useRef(0);
    // The run the user acted on. DELETE acts on whichever run the server has, so it is only sent for this one.
    const stopTarget = useRef<{ StartedAt?: string, State: TranscodeTestState } | undefined>(undefined);
    const statusQuery = useTranscodeTest(!!stopExpectation);
    const { data: status, dataUpdatedAt, isError: statusError, isFetching, isFetchedAfterMount, refetch } = statusQuery;
    const startTest = useStartTranscodeTest();
    const stopTest = useStopTranscodeTest();
    const isStopping = !!stopExpectation;
    // Cached or persisted status can be from another visit: nothing is enabled until a GET after mounting succeeds,
    // and results are not cleared while a refresh may still change them.
    const isBusy = status?.State === 'Running' || startTest.isPending || isStopping || !status || statusError
        || !isFetchedAfterMount || isFetching;
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
            stopIntent.current = undefined;
            stopTarget.current = undefined;
            setStopExpectation(undefined);
        }
    }, [ stopExpectation, stopTest.isSuccess, statusError, isFetching, dataUpdatedAt, status ]);

    useEffect(() => () => {
        // A cancelled refetch can resolve with cached data. Navigation must not turn that into another DELETE.
        stopRetryVersion.current += 1;
    }, []);

    const onStartCompatibility = useCallback(() => {
        stopRetryVersion.current += 1;
        stopIntent.current = undefined;
        stopTarget.current = undefined;
        stopTest.reset();
        startTest.mutate({ Kind: 'Compatibility' });
    }, [ startTest, stopTest ]);

    const onStartStress = useCallback((request: TranscodeTestRequest) => {
        stopRetryVersion.current += 1;
        stopIntent.current = undefined;
        stopTarget.current = undefined;
        stopTest.reset();
        startTest.mutate(request);
    }, [ startTest, stopTest ]);

    const onRetryStop = useCallback(() => {
        const intent = stopIntent.current;
        const target = stopTarget.current;
        if (!intent || !target) return;
        const retryVersion = ++stopRetryVersion.current;
        stopStatusUpdate.current = dataUpdatedAt;
        setStopExpectation(intent);
        // DELETE's reply may have been lost after the server processed it. Check first: retrying a confirmed Stop
        // as another DELETE would clear its results, and retrying a Clear must never stop a newly running test.
        // Another administrator may also have started a run since; DELETE would stop or clear theirs.
        void refetch({ throwOnError: true }).then(result => {
            if (retryVersion !== stopRetryVersion.current) return;
            if (result.isError || !result.data || result.dataUpdatedAt <= stopStatusUpdate.current) {
                setStopExpectation(undefined);
                return;
            }
            const state = result.data.State;
            if (result.data.StartedAt !== target.StartedAt || state === 'Idle'
                || (intent === 'Finished' && state !== 'Running')
                || (intent === 'Idle' && state !== target.State)) {
                stopIntent.current = undefined;
                stopTarget.current = undefined;
                stopTest.reset();
                setStopExpectation(undefined);
                return;
            }
            // Only a status read after this DELETE can confirm it.
            stopStatusUpdate.current = result.dataUpdatedAt;
            stopTest.mutate(undefined, {
                onError: () => setStopExpectation(undefined)
            });
        }).catch(() => {
            if (retryVersion === stopRetryVersion.current) setStopExpectation(undefined);
        });
    }, [ stopTest, refetch, dataUpdatedAt ]);

    // Stops a running test; once it has ended, explicitly clears its results.
    const onStop = useCallback(() => {
        if (!status) return;
        if (status.State === 'Running' && stopTest.isError && stopIntent.current === 'Finished') {
            // Clicking Stop again is also a retry; cached Running data may predate a lost cancellation reply.
            onRetryStop();
            return;
        }
        // Confirm with a fresh GET, as a retry does, that the server still has the run shown before sending DELETE.
        stopIntent.current = status.State === 'Running' ? 'Finished' : 'Idle';
        stopTarget.current = { StartedAt: status.StartedAt, State: status.State };
        onRetryStop();
    }, [ stopTest.isError, status, onRetryStop ]);

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
                    <Button color='inherit' onClick={onRetryStop} disabled={isStopping}>
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
