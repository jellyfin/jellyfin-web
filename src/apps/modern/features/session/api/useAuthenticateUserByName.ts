import type { Api } from '@jellyfin/sdk/lib/api';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { useMutation } from '@tanstack/react-query';

export interface UserCredentials {
    username: string
    password: string
}

export const useAuthenticateUserByName = (api?: Api) => useMutation({
    mutationFn: async ({ username, password }: UserCredentials) => {
        if (!api) throw new Error('No API instance available');

        const { data } = await getAuthenticationApi(api)
            .authenticateUserByName({
                authenticateUserByName: {
                    Username: username,
                    Pw: password
                }
            });
        return data;
    },
    // Don't keep the credentials in the mutation cache
    gcTime: 0
});
