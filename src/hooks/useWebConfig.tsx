import { useEffect } from 'react';

import { loadWebConfig, useWebConfigStore } from '../store/webConfigStore';

export const useWebConfig = () => useWebConfigStore((state) => state.config);

export const WebConfigProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        loadWebConfig();
    }, []);

    return <>{children}</>;
};
