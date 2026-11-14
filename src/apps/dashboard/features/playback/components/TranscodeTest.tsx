import React, { type FC, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import globalize from 'lib/globalize';
import {
    type TranscodeTestRequest,
    useStartTranscodeTest,
    useStopTranscodeTest,
    useTranscodeTest
} from '../api/useTranscodeTest';
import { startErrorMessage } from '../utils/transcodeTest';
import CompatibilityCheck from './CompatibilityCheck';
import StressTest from './StressTest';

/** The compatibility check and stress test at the bottom of the Transcoding page. Only one runs at a time. */
const TranscodeTest: FC = () => {
    const { data: status } = useTranscodeTest();
    const startTest = useStartTranscodeTest();
    const stopTest = useStopTranscodeTest();
    const isBusy = status?.State === 'Running' || startTest.isPending;
    const startError = startTest.isError ? startErrorMessage(startTest.error) : undefined;

    const onStartCompatibility = useCallback(() => {
        startTest.mutate({ Kind: 'Compatibility' });
    }, [ startTest ]);

    const onStartStress = useCallback((request: TranscodeTestRequest) => {
        startTest.mutate(request);
    }, [ startTest ]);

    // Stops a running test; once it has ended, clears its results.
    const onStop = useCallback(() => {
        stopTest.mutate();
    }, [ stopTest ]);

    return (
        <Stack spacing={4} sx={{ mt: 6 }}>
            <Divider />
            {startTest.isError && (
                <Alert severity='error'>
                    {startError ?
                        globalize.translate('TranscodingTestStartErrorServer', startError) :
                        globalize.translate('TranscodingTestStartError')}
                </Alert>
            )}
            <CompatibilityCheck status={status} isBusy={isBusy} onStart={onStartCompatibility} onClear={onStop} />
            <Divider />
            <StressTest status={status} isBusy={isBusy} onStart={onStartStress} onStop={onStop} onClear={onStop} />
        </Stack>
    );
};

export default TranscodeTest;
