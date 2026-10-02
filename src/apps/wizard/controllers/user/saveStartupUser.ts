import type { Api } from '@jellyfin/sdk';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { isAxiosError } from 'axios';

import { getAuthenticationApi } from 'utils/sdk/authentication-api';

/** Save the initial credentials, or authenticate if an interrupted setup already saved them. */
export default async function saveStartupUser(api: Api, name: string, password: string) {
    try {
        await getStartupApi(api).updateStartupUser({
            startupUserDto: { Name: name, Password: password }
        });
    } catch (error) {
        if (!isAxiosError(error) || error.response?.status !== 403) {
            throw error;
        }

        const { data } = await getAuthenticationApi(api).authenticateUserByName({
            authenticateUserByName: { Username: name, Pw: password }
        });
        return data;
    }
}
