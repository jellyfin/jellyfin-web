import { useMemo } from 'react';

import { useWebConfig } from './useWebConfig';

export function useThemes() {
    const { themes } = useWebConfig();

    const defaultTheme = useMemo(() => {
        return themes?.find(theme => theme.default);
    }, [ themes ]);

    return {
        themes: themes || [],
        defaultTheme
    };
}
