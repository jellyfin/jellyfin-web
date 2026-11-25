import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { OutboundWebSocketMessageType, type SocketMessageHandler } from '@jellyfin/sdk/lib/websocket';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React, { type PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryClient } from 'utils/query/queryClient';

import { QUERY_KEY } from '../api/useSessions';
import useLiveSessions from './useLiveSessions';

const { subscribe, getSessions } = vi.hoisted(() => ({
    subscribe: vi.fn(),
    getSessions: vi.fn()
}));

vi.mock('hooks/useApi', () => ({
    useApi: () => ({ api: { subscribe } })
}));

vi.mock('@jellyfin/sdk/lib/utils/api/session-api', () => ({
    getSessionApi: () => ({ getSessions })
}));

function makeSession(id: string, deviceId = 'shared-device'): SessionInfoDto {
    return {
        Id: id,
        DeviceId: deviceId,
        NowPlayingItem: { Name: id },
        LastActivityDate: new Date().toISOString()
    };
}

const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

function setup(initialSessions: SessionInfoDto[] | null = []) {
    if (initialSessions) {
        queryClient.setQueryData([ QUERY_KEY, { activeWithinSeconds: 960 } ], initialSessions);
    }
    const hook = renderHook(() => useLiveSessions(), { wrapper });
    const receive = subscribe.mock.lastCall?.[1] as SocketMessageHandler<'Sessions'>;

    return {
        result: hook.result,
        publish: (sessions?: SessionInfoDto[]) => act(async () => {
            receive({ MessageType: OutboundWebSocketMessageType.Sessions, Data: sessions });
        })
    };
}

beforeEach(() => {
    subscribe.mockReturnValue(vi.fn());
});

afterEach(() => {
    queryClient.clear();
    subscribe.mockReset();
    getSessions.mockReset();
});

describe('useLiveSessions', () => {
    it('keeps distinct sessions on the same device and updates them by session ID', async () => {
        const first = makeSession('first');
        const second = makeSession('second');
        const { result, publish } = setup([ first ]);

        await publish([ first, second ]);
        await waitFor(() => expect(result.current.data).toEqual([ first, second ]));

        const updatedSecond = { ...second, PlayState: { PositionTicks: 100 } };
        await publish([ updatedSecond, first ]);
        await waitFor(() => expect(result.current.data).toEqual([ first, updatedSecond ]));
    });

    it('removes absent sessions and clears the dashboard on an empty snapshot', async () => {
        const first = makeSession('first');
        const second = makeSession('second', 'other-device');
        const { result, publish } = setup([ first, second ]);

        await publish([ second ]);
        await waitFor(() => expect(result.current.data).toEqual([ second ]));

        await publish();
        expect(result.current.data).toEqual([ second ]);

        await publish([]);
        await waitFor(() => expect(result.current.data).toEqual([]));
    });

    it('keeps recently idle signed-in devices within the REST visibility window', async () => {
        const idle = {
            ...makeSession('idle'),
            NowPlayingItem: undefined,
            UserId: 'user',
            LastActivityDate: new Date(Date.now() - 7 * 60 * 1000).toISOString()
        };
        const expired = {
            ...idle,
            Id: 'expired',
            LastActivityDate: new Date(Date.now() - 17 * 60 * 1000).toISOString()
        };
        const { result, publish } = setup();

        await publish([ idle, expired ]);
        await waitFor(() => expect(result.current.data).toEqual([ idle ]));
    });

    it('keeps a live snapshot when the initial REST request resolves later', async () => {
        const stale = makeSession('stale');
        const live = makeSession('live');
        let finishRequest!: (response: { data: SessionInfoDto[] }) => void;
        getSessions.mockReturnValue(new Promise(resolve => {
            finishRequest = resolve;
        }));

        const { result, publish } = setup(null);
        await waitFor(() => expect(getSessions).toHaveBeenCalled());

        await publish([ live ]);
        await act(async () => {
            finishRequest({ data: [ stale ] });
        });

        await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
        expect(result.current.data).toEqual([ live ]);
    });
});
