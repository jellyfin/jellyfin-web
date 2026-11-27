import type { Api } from '@jellyfin/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTasks } from './useTasks';

const getTasksMock = vi.fn();

vi.mock('@jellyfin/sdk/lib/utils/api/scheduled-task-api', () => ({
    getScheduledTaskApi: () => ({ getTasks: getTasksMock })
}));

vi.mock('hooks/useApi', () => ({
    useApi: () => ({})
}));

const api = {} as Api;

describe('fetchTasks', () => {
    beforeEach(() => {
        getTasksMock.mockReset();
    });

    it('returns the task list', async () => {
        const data = [{ Id: 'a', Key: 'RefreshLibrary' }];
        getTasksMock.mockResolvedValue({ data });

        await expect(fetchTasks(api, { isHidden: false })).resolves.toBe(data);
        expect(getTasksMock).toHaveBeenCalledWith({ isHidden: false }, undefined);
    });

    it.each([
        [ 'an empty body', '' ],
        [ 'an HTML body', '<!DOCTYPE html><html></html>' ],
        [ 'null', null ],
        [ 'an object', {} ]
    ])('throws when the response is %s', async (_, data) => {
        getTasksMock.mockResolvedValue({ data });

        await expect(fetchTasks(api)).rejects.toThrow(TypeError);
    });
});
