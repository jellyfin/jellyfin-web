import React from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUs from 'strings/en-us.json';
import { QUERY_KEY, type TranscodeTestStatus } from '../api/useTranscodeTest';
import TranscodeTest from './TranscodeTest';

const requestMock = vi.hoisted(() => vi.fn());
const strings: Record<string, string | undefined> = enUs;

vi.mock('hooks/useApi', () => ({
    useApi: () => ({
        api: {
            basePath: 'https://test.invalid',
            authorizationHeader: 'MediaBrowser Token=test',
            axiosInstance: { request: requestMock }
        }
    })
}));

vi.mock('../api/useTestMediaSearch', () => ({
    useTestMediaSearch: () => ({ data: [], isFetching: false })
}));

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => {
            const text = strings[key];
            if (text == null) throw new Error(`Missing translation: ${key}`);
            return text.replace(/\{(\d+)\}/g, (_, index: string) => String(args[Number(index)] ?? ''));
        },
        getCurrentLocale: () => 'en-us'
    }
}));

const status = (state: TranscodeTestStatus['State'], kind: TranscodeTestStatus['Kind'] = 'Compatibility'): TranscodeTestStatus => ({
    State: state,
    Kind: kind,
    StartedAt: state === 'Idle' ? undefined : '2026-11-14T00:00:00Z',
    Checks: [],
    Log: [],
    Stress: kind === 'StressTest' ? {
        Phase: 'KeepingUp',
        EndReason: 'None',
        RunningStreams: 1,
        MaxStableStreams: 1,
        PeakStreams: 1,
        MaxStreams: 16,
        NextStreamInSeconds: 6,
        RampSeconds: 12,
        SettleSeconds: 3,
        FailSeconds: 6,
        StartTimeoutSeconds: 30,
        ThresholdFps: 24,
        FpsRatio: 0.9,
        SourceFps: 24,
        PeakCombinedFps: 60,
        Streams: [{ Id: 1, Fps: 60, Status: 'Running' }]
    } : undefined
});

const accessError = (httpStatus: number) => new AxiosError('Denied', undefined, undefined, undefined, {
    data: 'Denied',
    status: httpStatus,
    statusText: 'Denied',
    headers: {},
    config: { headers: new AxiosHeaders() }
});

const setup = (clearUnauthorizedStatus = false, retry: number | false = false) => {
    const queryClient = new QueryClient({
        queryCache: new QueryCache({
            onError: (_, query) => {
                if (clearUnauthorizedStatus) queryClient.setQueryData(query.queryKey, null);
            }
        }),
        defaultOptions: { queries: { retry, retryDelay: 0, gcTime: 0 }, mutations: { retry: false } }
    });
    const result = render(
        <QueryClientProvider client={queryClient}>
            <TranscodeTest />
        </QueryClientProvider>
    );
    return { ...result, queryClient, user: userEvent.setup() };
};

beforeEach(() => {
    requestMock.mockReset();
});

describe('transcoding test requests and controls', () => {
    it('surfaces a failed initial GET, blocks starts, and retries with authentication and cancellation support', async () => {
        requestMock.mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValue({ data: status('Idle') });
        const { user } = setup();

        expect(await screen.findByText(enUs.TranscodingTestStatusError)).toBeVisible();
        expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: enUs.Retry }));
        await waitFor(() => expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeEnabled());
        expect(screen.queryByText(enUs.TranscodingTestStatusError)).not.toBeInTheDocument();
        expect(requestMock).toHaveBeenLastCalledWith(expect.objectContaining({
            url: 'https://test.invalid/Transcoding/Test',
            method: 'GET',
            headers: { Authorization: 'MediaBrowser Token=test' },
            signal: expect.any(AbortSignal)
        }));
    });

    it('shows a GET failure only after React Query stops retrying', async () => {
        requestMock.mockRejectedValueOnce(new Error('Blip'))
            .mockRejectedValueOnce(new Error('Blip'))
            .mockImplementationOnce(() => new Promise(() => undefined));
        setup(false, 2);

        // Two failed attempts and a third still in flight: no error yet.
        await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(3));
        expect(screen.queryByText(enUs.TranscodingTestStatusError)).not.toBeInTheDocument();
    });

    it('shows a GET failure once every retry failed', async () => {
        requestMock.mockRejectedValue(new Error('Network unavailable'));
        setup(false, 2);

        expect(await screen.findByText(enUs.TranscodingTestStatusError)).toBeVisible();
        expect(requestMock).toHaveBeenCalledTimes(3);
    });

    it.each([ 401, 403 ])('explains denied/expired access for GET %i and offers retry', async httpStatus => {
        requestMock.mockRejectedValue(accessError(httpStatus));
        setup();

        expect(await screen.findByText(enUs.TranscodingTestAccessError)).toBeVisible();
        await waitFor(() => expect(screen.getByRole('button', { name: enUs.Retry })).toBeEnabled());
        expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeDisabled();
    });

    it('retains an access error when the application cache clears unauthorized query data', async () => {
        requestMock.mockRejectedValue(accessError(401));
        const { user } = setup(true);

        expect(await screen.findByText(enUs.TranscodingTestAccessError)).toBeVisible();
        expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeDisabled();
        requestMock.mockResolvedValue({ data: status('Idle') });
        await user.click(screen.getByRole('button', { name: enUs.Retry }));
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestAccessError)).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeEnabled();
    });

    it('keeps cached running status visible when a later refresh fails, then reconnects', async () => {
        requestMock.mockResolvedValue({ data: status('Running') });
        const { queryClient, user } = setup();
        expect(await screen.findByRole('button', { name: enUs.ButtonStopTest })).toBeEnabled();

        requestMock.mockRejectedValue(new Error('Disconnected'));
        await act(async () => {
            await queryClient.refetchQueries({ queryKey: [ QUERY_KEY ] });
        });
        expect(await screen.findByText(enUs.TranscodingTestStatusError)).toBeVisible();
        expect(screen.getByRole('button', { name: enUs.ButtonStopTest })).toBeEnabled();
        expect(screen.queryByText(enUs.TranscodingTestStopped)).not.toBeInTheDocument();

        requestMock.mockResolvedValue({ data: status('Running') });
        await user.click(screen.getByRole('button', { name: enUs.Retry }));
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStatusError)).not.toBeInTheDocument());
    });

    it.each([ 'Compatibility', 'StressTest' ] as const)('waits for GET confirmation after stopping %s with the keyboard', async kind => {
        let serverStatus = status('Running', kind);
        requestMock.mockImplementation(async () => ({ data: serverStatus }));
        const { queryClient, user } = setup();
        const stop = await screen.findByRole('button', { name: enUs.ButtonStopTest });
        stop.focus();
        await user.keyboard('{Enter}');

        await waitFor(() => expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE' })));
        expect(await screen.findByText(enUs.TranscodingTestStopping)).toBeVisible();
        expect(screen.getByRole('button', { name: enUs.LabelStopping })).toBeDisabled();
        expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeDisabled();
        expect(screen.queryByText(enUs.TranscodingTestStopped)).not.toBeInTheDocument();

        serverStatus = {
            ...status('Cancelled', kind),
            Stress: kind === 'StressTest' ? {
                ...serverStatus.Stress!,
                Phase: 'Finished',
                EndReason: 'Cancelled'
            } : undefined
        };
        await act(async () => {
            await queryClient.refetchQueries({ queryKey: [ QUERY_KEY ] });
        });
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStopping)).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeEnabled();
        expect(screen.getByRole('button', { name: enUs.ButtonClearTestResults })).toBeEnabled();
    });

    it('shows DELETE failure without claiming cancellation and allows a retry', async () => {
        let failStop = true;
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE' && failStop) throw new Error('Network unavailable');
            return { data: status('Running') };
        });
        const { user } = setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));

        expect(await screen.findByText(enUs.TranscodingTestStopError)).toBeVisible();
        expect(screen.getByRole('button', { name: enUs.ButtonStopTest })).toBeEnabled();
        expect(screen.queryByText(enUs.TranscodingTestStopped)).not.toBeInTheDocument();
        expect(screen.queryByText(enUs.TranscodingTestStopping)).not.toBeInTheDocument();

        failStop = false;
        await user.click(screen.getByRole('button', { name: enUs.Retry }));
        expect(await screen.findByText(enUs.TranscodingTestStopping)).toBeVisible();
        expect(screen.queryByText(enUs.TranscodingTestStopError)).not.toBeInTheDocument();
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(2);
    });

    it('reports expired authorization when DELETE is denied', async () => {
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE') throw accessError(401);
            return { data: status('Running') };
        });
        const { user } = setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));

        expect(await screen.findByText(enUs.TranscodingTestAccessError)).toBeVisible();
        expect(screen.getByRole('button', { name: enUs.Retry })).toBeEnabled();
        expect(screen.queryByText(enUs.TranscodingTestStopped)).not.toBeInTheDocument();
    });

    it('reports expired authorization when starting a test is denied', async () => {
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'POST') throw accessError(401);
            return { data: status('Idle') };
        });
        const { user } = setup();
        const start = screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck });
        await waitFor(() => expect(start).toBeEnabled());
        await user.click(start);

        expect(await screen.findByText(enUs.TranscodingTestAccessError)).toBeVisible();
        expect(screen.queryByText(enUs.CompatibilityCheckRunning)).not.toBeInTheDocument();
    });

    it('does not unlock clear-result controls until a fresh GET returns Idle', async () => {
        let serverStatus = status('Completed');
        requestMock.mockImplementation(async () => ({ data: serverStatus }));
        const { queryClient, user } = setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonClearTestResults }));

        expect(await screen.findByText(enUs.TranscodingTestStopping)).toBeVisible();
        expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeDisabled();
        serverStatus = status('Idle');
        await act(async () => {
            await queryClient.refetchQueries({ queryKey: [ QUERY_KEY ] });
        });
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStopping)).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck })).toBeEnabled();
    });

    it.each([ 'Compatibility', 'StressTest' ] as const)('labels %s progress and announces status politely', async kind => {
        requestMock.mockResolvedValue({ data: status('Running', kind) });
        setup();

        const progress = await screen.findByRole('progressbar');
        expect(progress).toHaveAccessibleName();
        expect(screen.getAllByRole('status').some(element => element.getAttribute('aria-live') === 'polite')).toBe(true);
    });

    it.each([ 0, 3 ])('renders inconclusive stress result with %i certified streams neutrally', async count => {
        const result = status('Completed', 'StressTest');
        result.Stress = {
            ...result.Stress!,
            Phase: 'Finished',
            EndReason: 'Inconclusive',
            MaxStableStreams: count,
            SingleStreamFps: count ? 60 : undefined,
            Error: 'Measurement budget exhausted <not markup>'
        };
        requestMock.mockResolvedValue({ data: result });
        setup();

        const chip = await screen.findByText(enUs.StressTestStatusInconclusive);
        expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorInfo');
        const heading = count ? enUs.StressTestAtLeastStreamCount.replace('{0}', '3 streams') : enUs.StressTestCapacityNotMeasured;
        expect(screen.getByText(heading)).toBeVisible();
        const message = count ? enUs.StressTestFinishedInconclusiveLowerBound.replace('{0}', '3 streams') : enUs.StressTestFinishedInconclusive;
        expect(screen.getByText(`${message} ${result.Stress.Error}`)).toBeVisible();
        expect(screen.queryByText('0 streams')).not.toBeInTheDocument();
        expect(screen.queryByText(/One stream alone ran/)).not.toBeInTheDocument();
        expect(screen.queryByText(enUs.StressTestStatusLimitReached)).not.toBeInTheDocument();
        expect(document.querySelector('not')).not.toBeInTheDocument();
    });

    it('aborts an in-flight status request when the page unmounts', async () => {
        requestMock.mockImplementation(() => new Promise(() => { /* Remain pending until unmount. */ }));
        const { unmount } = setup();
        await waitFor(() => expect(requestMock).toHaveBeenCalled());
        const signal = requestMock.mock.calls[0][0].signal as AbortSignal;

        unmount();

        expect(signal.aborted).toBe(true);
    });
});
