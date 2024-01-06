import { useEffect, useState } from 'react';
import { UserDto } from '@jellyfin/sdk/lib/generated-client';

import { useApi } from 'hooks/useApi';

interface UsePreferencesMenuUserParams {
    userId?: string | null;
}

export function usePreferencesMenuUser({ userId }: UsePreferencesMenuUserParams) {
    const [user, setUser] = useState<UserDto>();
    const { __legacyApiClient__: api, user: currentUser } = useApi();

    useEffect(() => {
        void (async () => {
            const preferencesMenuUser =
                !userId || userId === currentUser?.Id ? currentUser : await api?.getUser(userId);
            setUser(preferencesMenuUser);
        })();
    }, [api, currentUser, userId]);

    return { user };
}
