import React, { type FC, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import type { TranscodeTestOutcome, TranscodeTestStatus } from '../api/useTranscodeTest';
import { checkAdvice, checkDetail, checkError, checkKindLabel, checkName, compatibilityChanges, formatNumber, outcomeLabel } from '../utils/transcodeTest';
import TestConsole from './TestConsole';

const OUTCOME_COLORS: Record<TranscodeTestOutcome, 'success' | 'error' | 'warning' | 'default'> = {
    Passed: 'success',
    Failed: 'error',
    Software: 'warning',
    NotSupported: 'default',
    Skipped: 'default'
};

const settingLabel = (enabled?: boolean) => {
    if (enabled == null) {
        return '—';
    }
    return globalize.translate(enabled ? 'TranscodingTestSettingOn' : 'TranscodingTestSettingOff');
};

interface CompatibilityCheckProps {
    status?: TranscodeTestStatus
    isBusy: boolean
    isStopping: boolean
    onStart: () => void
    onStop: () => void
    onClear: () => void
}

const CompatibilityCheck: FC<CompatibilityCheckProps> = ({ status, isBusy, isStopping, onStart, onStop, onClear }) => {
    const isMine = status?.Kind === 'Compatibility';
    const isRunning = isMine && status.State === 'Running';
    const checks = isMine ? status.Checks : [];
    const working = checks.filter(c => c.Outcome === 'Passed').length;
    const changes = checks.filter(c => c.Advice !== 'None').length;
    const tested = checks.filter(c => c.Outcome !== 'Skipped').length;

    const onRun = useCallback(() => onStart(), [ onStart ]);
    const onStopClick = useCallback(() => onStop(), [ onStop ]);
    const onClearClick = useCallback(() => onClear(), [ onClear ]);

    return (
        <Stack spacing={2}>
            <Typography variant='h2'>{globalize.translate('HeaderCompatibilityCheck')}</Typography>
            <Typography>{globalize.translate('CompatibilityCheckHelp')}</Typography>
            <Stack direction='row' spacing={2}>
                <Button size='large' onClick={onRun} disabled={isBusy}>
                    {globalize.translate('ButtonRunCompatibilityCheck')}
                </Button>
                {isRunning && (
                    <Button size='large' color='error' variant='outlined' onClick={onStopClick} disabled={isStopping}>
                        {globalize.translate(isStopping ? 'LabelStopping' : 'ButtonStopTest')}
                    </Button>
                )}
                {isMine && !isBusy && (
                    <Button size='large' variant='text' onClick={onClearClick}>
                        {globalize.translate('ButtonClearTestResults')}
                    </Button>
                )}
            </Stack>

            {isRunning && (
                <Stack spacing={1}>
                    {!isStopping && (
                        <Typography color='text.secondary' role='status' aria-live='polite'>
                            {globalize.translate('CompatibilityCheckRunning')}
                        </Typography>
                    )}
                    <LinearProgress aria-label={globalize.translate('HeaderCompatibilityCheck')} />
                </Stack>
            )}

            {isMine && status.State === 'Completed' && tested > 0 && (
                <Alert severity={changes > 0 ? 'warning' : 'success'}>
                    {globalize.translate('CompatibilityCheckSummary', working, tested)}
                    {' '}
                    {compatibilityChanges(changes)}
                </Alert>
            )}
            {isMine && status.State === 'Failed' && (
                <Alert severity='error'>{globalize.translate('TranscodingTestFailed')}</Alert>
            )}
            {isMine && status.State === 'Cancelled' && (
                <Alert severity='info'>{globalize.translate('TranscodingTestStopped')}</Alert>
            )}

            {checks.length > 0 && (
                <Table size='small' aria-label={globalize.translate('HeaderCompatibilityCheck')}>
                    <TableHead>
                        <TableRow>
                            <TableCell>{globalize.translate('HeaderTranscodingTestCheck')}</TableCell>
                            <TableCell>{globalize.translate('HeaderTranscodingTestResult')}</TableCell>
                            <TableCell>{globalize.translate('HeaderTranscodingTestSetting')}</TableCell>
                            <TableCell align='right'>{globalize.translate('HeaderTranscodingTestFps')}</TableCell>
                            <TableCell>{globalize.translate('HeaderTranscodingTestDetails')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {checks.map(check => {
                            const advice = checkAdvice(check);
                            const error = checkError(check);
                            return (
                                <TableRow key={`${check.Kind}-${check.Codec}-${check.BitDepth}-${check.Hdr}`}>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {checkKindLabel(check.Kind)} {checkName(check)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size='small'
                                            color={OUTCOME_COLORS[check.Outcome]}
                                            label={outcomeLabel(check.Outcome)}
                                        />
                                    </TableCell>
                                    <TableCell>{settingLabel(check.EnabledInSettings)}</TableCell>
                                    <TableCell align='right'>{check.Fps != null ? formatNumber(check.Fps, 0) : '—'}</TableCell>
                                    <TableCell>
                                        {checkDetail(check)}
                                        {error && (
                                            <Typography component='span' variant='caption' color='text.secondary' sx={{ display: 'block', wordBreak: 'break-word' }}>
                                                {error}
                                            </Typography>
                                        )}
                                        {advice && (
                                            <Typography component='span' color='warning.main' sx={{ display: 'block' }}>
                                                {advice}
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {isMine && <TestConsole log={status.Log} />}
        </Stack>
    );
};

export default CompatibilityCheck;
