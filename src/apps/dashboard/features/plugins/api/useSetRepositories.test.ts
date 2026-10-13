import { AxiosError } from 'axios';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSetRepositories } from './useSetRepositories';

const { post, save } = vi.hoisted(() => ({ post: vi.fn(), save: vi.fn() }));
vi.mock('hooks/useApi', () => ({ useApi: () => ({ api: {
    basePath: 'https://server.example/jellyfin',
    authorizationHeader: 'test-authorization',
    axiosInstance: { post }
} }) }));
vi.mock('@tanstack/react-query', () => ({ useMutation: (options: unknown) => options }));
vi.mock('utils/query/queryClient', () => ({ queryClient: { invalidateQueries: vi.fn() } }));
vi.mock('@jellyfin/sdk/lib/utils/api/plugin-api', () => ({ getPluginApi: () => ({ setRepositories: save }) }));

describe('repository validation before saving', () => {
    const repository: RepositoryInfo = { Name: 'Test', Url: 'https://repo.example/manifest.json', Enabled: true };
    const run = (validateRepository?: RepositoryInfo) => {
        const mutation = useSetRepositories() as unknown as {
            mutationFn: (params: { repositoryInfo: RepositoryInfo[]; validateRepository?: RepositoryInfo }) => Promise<unknown>;
        };
        return mutation.mutationFn({ repositoryInfo: [ repository ], validateRepository });
    };

    beforeEach(() => {
        post.mockReset().mockResolvedValue({ status: 204 });
        save.mockReset().mockResolvedValue({ status: 204 });
    });

    it('does not save when validation fails', async () => {
        post.mockRejectedValue(new Error('Invalid repository'));
        await expect(run(repository)).rejects.toThrow('Invalid repository');
        expect(save).not.toHaveBeenCalled();
    });

    it('authenticates validation and saves only after it succeeds', async () => {
        await run(repository);
        expect(post).toHaveBeenCalledWith('https://server.example/jellyfin/Repositories/Validate', repository, {
            headers: { Authorization: 'test-authorization' }
        });
        expect(save).toHaveBeenCalledWith({ repositoryInfo: [ repository ] });
        expect(post.mock.invocationCallOrder[0]).toBeLessThan(save.mock.invocationCallOrder[0]);
    });

    it.each([ 404, 405 ])('preserves adding on older servers without validation (HTTP %s)', async (status) => {
        const error = new AxiosError('Endpoint unavailable');
        Object.assign(error, { response: { status } });
        post.mockRejectedValue(error);
        await run(repository);
        expect(save).toHaveBeenCalledWith({ repositoryInfo: [ repository ] });
    });

    it('can remove or disable repositories without contacting them', async () => {
        await run();
        expect(post).not.toHaveBeenCalled();
        expect(save).toHaveBeenCalledWith({ repositoryInfo: [ repository ] });
    });
});
