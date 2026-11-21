import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../components/toast/toast', () => ({ default: vi.fn() }));
vi.mock('../../../lib/globalize', () => ({ default: { translate: (key) => key } }));
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));

import Manager from './Manager';

const groupInfo = {
    GroupId: 'group',
    GroupName: 'Group',
    Participants: ['user'],
    LastUpdatedAt: '2026-01-01T00:00:00.000Z'
};

const playQueue = { Reason: 'NewPlaylist', Playlist: [] };

describe('SyncPlay Manager', () => {
    let manager;

    beforeEach(() => {
        manager = new Manager({
            getDefaultWrapper: () => ({ bindToPlayer: vi.fn(), unbindFromPlayer: vi.fn() })
        });
        manager.playerWrapper = manager.playerFactory.getDefaultWrapper(manager);
        manager.timeSyncCore.forceUpdate = vi.fn();
        manager.queueCore.updatePlayQueue = vi.fn();
    });

    it('ignores group updates when this client is not in a group', () => {
        manager.processGroupUpdate({ Type: 'GroupJoined', Data: { ...groupInfo } }, {});
        manager.processGroupUpdate({ Type: 'PlayQueue', Data: playQueue }, {});

        expect(manager.isSyncPlayEnabled()).toBe(false);
        expect(manager.queueCore.updatePlayQueue).not.toHaveBeenCalled();
    });

    it('joins the group this client asked to join', () => {
        manager.expectGroupJoin(Promise.resolve());
        manager.processGroupUpdate({ Type: 'GroupJoined', Data: { ...groupInfo } }, {});
        manager.processGroupUpdate({ Type: 'PlayQueue', Data: playQueue }, {});

        expect(manager.isSyncPlayEnabled()).toBe(true);
        expect(manager.queueCore.updatePlayQueue).toHaveBeenCalledOnce();
    });

    it('stops waiting for a group after the request was denied', () => {
        manager.expectGroupJoin(Promise.resolve());
        manager.processGroupUpdate({ Type: 'JoinGroupDenied', Data: '' }, {});
        manager.processGroupUpdate({ Type: 'GroupJoined', Data: { ...groupInfo } }, {});

        expect(manager.isSyncPlayEnabled()).toBe(false);
    });

    it('stops waiting for a group after the request failed', async () => {
        const request = Promise.reject(new Error('Forbidden'));
        manager.expectGroupJoin(request);
        await request.catch(() => undefined);
        await Promise.resolve();

        manager.processGroupUpdate({ Type: 'GroupJoined', Data: { ...groupInfo } }, {});

        expect(manager.isSyncPlayEnabled()).toBe(false);
    });
});
