import { useEffect, useState } from 'react';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';

import { useApi } from 'hooks/useApi';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';

interface UsePreferencesMenuUserParams {
    userId?: string | null;
}

export function usePreferencesMenuUser({ userId }: UsePreferencesMenuUserParams) {
    const [user, setUser] = useState<UserDto>();
    const { api, user: currentUser } = useApi();

    useEffect(() => {
        void (async () => {
            const preferencesMenuUser =
                !userId || userId === currentUser?.Id ?
                    currentUser :
                    api && (await getUserApi(api).getUserById({ userId })).data;
            setUser(preferencesMenuUser);
        })();
    }, [api, currentUser, userId]);

    return { user };
}
