import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUs from 'strings/en-us.json';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY, type TranscodeTestStatus } from '../api/useTranscodeTest';
import TranscodeTest from './TranscodeTest';

const requestMock = vi.hoisted(() => vi.fn());
const strings: Record<string, string | undefined> = enUs;
const defaults = queryClient.getDefaultOptions();

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

const status = (state: TranscodeTestStatus['State'], startedAt?: string): TranscodeTestStatus => ({
    State: state,
    Kind: 'Compatibility',
    StartedAt: startedAt,
    Checks: [],
    Log: state === 'Cancelled' ? [{ Seconds: 1, Message: 'Cancellation confirmed' }] : []
});

const accessError = (httpStatus: number) => new AxiosError('Denied', undefined, undefined, undefined, {
    data: 'Denied',
    status: httpStatus,
    statusText: 'Denied',
    headers: {},
    config: { headers: new AxiosHeaders() }
});

const deferredStatus = () => {
    let resolve!: (value: { data: TranscodeTestStatus }) => void;
    const promise = new Promise<{ data: TranscodeTestStatus }>(onResolve => {
        resolve = onResolve;
    });
    return { promise, resolve };
};

const mount = () => render(
    <QueryClientProvider client={queryClient}>
        <TranscodeTest />
    </QueryClientProvider>
);

const runButton = () => screen.getByRole('button', { name: enUs.ButtonRunCompatibilityCheck });

const stopRetryButton = () => {
    const alert = screen.getByText(enUs.TranscodingTestStopError).closest('[role="alert"]');
    if (!alert) throw new Error('Missing Stop error alert');
    return within(alert as HTMLElement).getByRole('button', { name: enUs.Retry });
};

const refresh = () => act(async () => {
    await queryClient.refetchQueries({ queryKey: [ QUERY_KEY ] });
});

beforeEach(() => {
    requestMock.mockReset();
    queryClient.clear();
    // Preserve the production cancellation, null-on-401, retry, stale-time and GC behavior.
    queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retryDelay: 0 } });
});

afterEach(() => {
    cleanup();
    queryClient.clear();
    queryClient.setDefaultOptions(defaults);
});

describe('transcoding test with the production query cache', () => {
    it.each([ 401, 403 ])('fetches again after navigating away from GET %i and gates starts until success', async httpStatus => {
        requestMock.mockRejectedValue(accessError(httpStatus));
        const first = mount();
        expect(await screen.findByText(enUs.TranscodingTestAccessError)).toBeVisible();
        await waitFor(() => expect(screen.getByRole('button', { name: enUs.Retry })).toBeEnabled());
        expect(runButton()).toBeDisabled();
        const previousRequests = requestMock.mock.calls.length;
        first.unmount();

        const pending = deferredStatus();
        requestMock.mockImplementation(() => pending.promise);
        mount();
        await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(previousRequests + 1));
        expect(runButton()).toBeDisabled();

        pending.resolve({ data: status('Idle') });
        await waitFor(() => expect(runButton()).toBeEnabled());
        expect(screen.queryByText(enUs.TranscodingTestAccessError)).not.toBeInTheDocument();
    });

    it('does not enable starts during a retry without any successfully loaded status', async () => {
        requestMock.mockRejectedValue(new Error('Network unavailable'));
        mount();
        expect(await screen.findByText(enUs.TranscodingTestStatusError)).toBeVisible();
        expect(requestMock).toHaveBeenCalledTimes(3);
        const pending = deferredStatus();
        requestMock.mockImplementation(() => pending.promise);
        await userEvent.setup().click(screen.getByRole('button', { name: enUs.Retry }));

        await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(4));
        expect(runButton()).toBeDisabled();
        pending.resolve({ data: status('Idle') });
        await waitFor(() => expect(runButton()).toBeEnabled());
    });

    it.each([ 'Retry', 'Stop' ])('confirms a lost DELETE response via %s without clearing stopped results', async control => {
        let serverStatus = status('Running');
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE') {
                // The server processed cancellation, but its response never reached the client.
                serverStatus = status(serverStatus.State === 'Running' ? 'Cancelled' : 'Idle');
                throw new Error('Response lost');
            }
            return { data: serverStatus };
        });
        mount();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));
        expect(await screen.findByText(enUs.TranscodingTestStopError)).toBeVisible();
        if (control === 'Retry') {
            await refresh();
            expect(queryClient.getQueryData<TranscodeTestStatus>([ QUERY_KEY ])?.State).toBe('Cancelled');
            await user.click(stopRetryButton());
        } else {
            await user.click(screen.getByRole('button', { name: enUs.ButtonStopTest }));
        }
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStopError)).not.toBeInTheDocument());
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(1);
        expect(queryClient.getQueryData<TranscodeTestStatus>([ QUERY_KEY ])?.Log).toEqual(status('Cancelled').Log);
        expect(screen.queryByText(enUs.TranscodingTestStopping)).not.toBeInTheDocument();
        expect(runButton()).toBeEnabled();
    });

    it('retains Stop intent when access clears cached status before the retry', async () => {
        let serverStatus = status('Running');
        let denied = false;
        let failStop = true;
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE') {
                if (failStop) throw new Error('Network unavailable');
                serverStatus = status('Cancelled');
            } else if (denied) {
                throw accessError(401);
            }
            return { data: serverStatus };
        });
        mount();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));
        expect(await screen.findByText(enUs.TranscodingTestStopError)).toBeVisible();
        denied = true;
        await refresh();
        expect(await screen.findByText(enUs.TranscodingTestAccessError)).toBeVisible();
        expect(queryClient.getQueryData([ QUERY_KEY ])).toBeNull();

        denied = false;
        failStop = false;
        await user.click(stopRetryButton());
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStopping)).not.toBeInTheDocument(), { timeout: 3000 });
        await waitFor(() => expect(runButton()).toBeEnabled(), { timeout: 3000 });
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(2);
        expect(queryClient.getQueryData<TranscodeTestStatus>([ QUERY_KEY ])?.State).toBe('Cancelled');
        expect(screen.queryByText(enUs.TranscodingTestStopError)).not.toBeInTheDocument();
    });

    it('does not turn a failed Clear retry into Stop for a newly running test', async () => {
        let serverStatus = status('Completed');
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE') {
                if (serverStatus.State === 'Running') serverStatus = status('Cancelled');
                throw new Error('Response lost');
            }
            return { data: serverStatus };
        });
        mount();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonClearTestResults }));
        expect(await screen.findByText(enUs.TranscodingTestStopError)).toBeVisible();
        serverStatus = status('Running');

        await user.click(stopRetryButton());
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStopError)).not.toBeInTheDocument());
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(1);
        expect(queryClient.getQueryData<TranscodeTestStatus>([ QUERY_KEY ])?.State).toBe('Running');
        expect(await screen.findByRole('button', { name: enUs.ButtonStopTest })).toBeEnabled();
    });

    it('does not retry DELETE using stale Running data when its reconciliation GET fails', async () => {
        let failStatus = false;
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE' || failStatus) throw new Error('Network unavailable');
            return { data: status('Running') };
        });
        mount();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));
        expect(await screen.findByText(enUs.TranscodingTestStopError)).toBeVisible();
        failStatus = true;
        await user.click(stopRetryButton());

        expect(await screen.findByText(enUs.TranscodingTestStatusError)).toBeVisible();
        await waitFor(() => expect(stopRetryButton()).toBeEnabled());
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(1);
        expect(screen.getByRole('button', { name: enUs.ButtonStopTest })).toBeEnabled();
    });

    it('keeps successful DELETE pending through lost access until a fresh GET confirms cancellation', async () => {
        let serverStatus = status('Running');
        let denied = false;
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'GET' && denied) throw accessError(401);
            return { data: serverStatus };
        });
        mount();
        await userEvent.setup().click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));
        expect(await screen.findByText(enUs.TranscodingTestStopping)).toBeVisible();
        denied = true;
        await refresh();
        expect(await screen.findByText(enUs.TranscodingTestAccessError)).toBeVisible();
        expect(runButton()).toBeDisabled();
        expect(screen.getByText(enUs.TranscodingTestStopping)).toBeVisible();

        denied = false;
        serverStatus = status('Cancelled');
        await refresh();
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStopping)).not.toBeInTheDocument());
        expect(runButton()).toBeEnabled();
    });

    it('enables nothing from cached Completed status while the fresh GET after mounting is pending', async () => {
        // The status may also come from the persisted cache of an earlier visit.
        queryClient.setQueryData([ QUERY_KEY ], status('Completed', '2026-11-15T10:00:00Z'));
        const pending = deferredStatus();
        requestMock.mockImplementation(() => pending.promise);
        mount();
        await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(1));

        expect(runButton()).toBeDisabled();
        expect(screen.queryByRole('button', { name: enUs.ButtonClearTestResults })).not.toBeInTheDocument();

        pending.resolve({ data: status('Completed', '2026-11-15T10:00:00Z') });
        await waitFor(() => expect(runButton()).toBeEnabled());
        expect(screen.getByRole('button', { name: enUs.ButtonClearTestResults })).toBeEnabled();
    });

    it.each([
        [ 'an empty object', {} ],
        [ 'an unknown state', { State: 'Paused', Checks: [], Log: [] } ],
        [ 'a non-string state', { State: 1, Checks: [], Log: [] } ],
        [ 'a page', '<html></html>' ]
    ])('treats a 200 reply with %s as a status error', async (_, body) => {
        requestMock.mockResolvedValue({ data: body });
        mount();
        expect(await screen.findByText(enUs.TranscodingTestStatusError)).toBeVisible();
        expect(runButton()).toBeDisabled();
        expect(queryClient.getQueryData([ QUERY_KEY ])).toBeUndefined();
    });

    it('does not retry Stop when another administrator started a new run after the lost DELETE', async () => {
        let serverStatus = status('Running', '2026-11-15T10:00:00Z');
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE') {
                serverStatus = status('Cancelled', '2026-11-15T10:00:00Z');
                throw new Error('Response lost');
            }
            return { data: serverStatus };
        });
        mount();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));
        expect(await screen.findByText(enUs.TranscodingTestStopError)).toBeVisible();
        serverStatus = status('Running', '2026-11-15T10:05:00Z');

        await user.click(stopRetryButton());
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStopError)).not.toBeInTheDocument());
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(1);
        expect(queryClient.getQueryData<TranscodeTestStatus>([ QUERY_KEY ])?.StartedAt).toBe('2026-11-15T10:05:00Z');
        expect(screen.queryByText(enUs.TranscodingTestStopping)).not.toBeInTheDocument();
    });

    it.each([
        [ 'Stop', status('Running', '2026-11-15T10:00:00Z'), enUs.ButtonStopTest ],
        [ 'Clear', status('Completed', '2026-11-15T10:00:00Z'), enUs.ButtonClearTestResults ]
    ])('does not %s a run that another administrator started since the status was shown', async (_, shown, button) => {
        let serverStatus = shown;
        requestMock.mockImplementation(async () => ({ data: serverStatus }));
        mount();
        const user = userEvent.setup();
        const control = await screen.findByRole('button', { name: button });
        serverStatus = status('Running', '2026-11-15T10:05:00Z');

        await user.click(control);
        await waitFor(() => expect(queryClient.getQueryData<TranscodeTestStatus>([ QUERY_KEY ])?.StartedAt).toBe('2026-11-15T10:05:00Z'));
        await waitFor(() => expect(screen.queryByText(enUs.TranscodingTestStopping)).not.toBeInTheDocument());
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(0);
        expect(screen.getByRole('button', { name: enUs.ButtonStopTest })).toBeEnabled();
    });

    it('notes that a remote source\'s delivery speed is part of the stress result', async () => {
        requestMock.mockResolvedValue({ data: {
            ...status('Completed', '2026-11-15T10:00:00Z'),
            Kind: 'StressTest',
            Stress: {
                Phase: 'Finished', EndReason: 'LimitReached', RunningStreams: 0, MaxStableStreams: 2, PeakStreams: 3,
                MaxStreams: 16, NextStreamInSeconds: 0, RampSeconds: 12, SettleSeconds: 3, FailSeconds: 5,
                StartTimeoutSeconds: 30, ThresholdFps: 24, FpsRatio: 1, SourceFps: 24, PeakCombinedFps: 72,
                RemoteSource: true, Streams: []
            }
        } satisfies TranscodeTestStatus });
        mount();
        expect(await screen.findByText(enUs.StressTestRemoteSource)).toBeVisible();
    });

    it('aborts a pending status GET when navigating away', async () => {
        requestMock.mockImplementation(() => new Promise(() => undefined));
        const { unmount } = mount();
        await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(1));
        const signal = requestMock.mock.calls[0][0].signal as AbortSignal;

        unmount();

        expect(signal.aborted).toBe(true);
    });

    it('does not send another DELETE after a reconciliation GET is aborted by navigation', async () => {
        const pending = deferredStatus();
        let confirming = false;
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE') throw new Error('Network unavailable');
            return confirming ? pending.promise : { data: status('Running') };
        });
        const { unmount } = mount();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));
        expect(await screen.findByText(enUs.TranscodingTestStopError)).toBeVisible();
        confirming = true;
        await user.click(stopRetryButton());
        await waitFor(() => expect(screen.getByText(enUs.TranscodingTestStopping)).toBeVisible());
        const signal = requestMock.mock.lastCall![0].signal as AbortSignal;

        unmount();
        expect(signal.aborted).toBe(true);
        await act(async () => {
            pending.resolve({ data: status('Running') });
        });
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(1);
    });

    it('does not treat cached Running data returned by a cancelled GET as fresh confirmation', async () => {
        const pending = deferredStatus();
        let confirming = false;
        requestMock.mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'DELETE') throw new Error('Network unavailable');
            return confirming ? pending.promise : { data: status('Running') };
        });
        mount();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: enUs.ButtonStopTest }));
        expect(await screen.findByText(enUs.TranscodingTestStopError)).toBeVisible();
        confirming = true;
        await user.click(stopRetryButton());
        await waitFor(() => expect(screen.getByText(enUs.TranscodingTestStopping)).toBeVisible());

        await act(async () => {
            await queryClient.cancelQueries({ queryKey: [ QUERY_KEY ] });
        });

        await waitFor(() => expect(stopRetryButton()).toBeEnabled());
        expect(requestMock.mock.calls.filter(([ request ]) => request.method === 'DELETE')).toHaveLength(1);
        expect(queryClient.getQueryData<TranscodeTestStatus>([ QUERY_KEY ])?.State).toBe('Running');
    });
});
