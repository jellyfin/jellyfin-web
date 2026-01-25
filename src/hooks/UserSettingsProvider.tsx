import React from 'react';
import { useUserSettingsStore } from '../store/userSettingsStore';

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const updateFromLegacy = useUserSettingsStore(state => state.updateFromLegacy);

    React.useEffect(() => {
        updateFromLegacy();
    }, [updateFromLegacy]);

    return <>{children}</>;
};
