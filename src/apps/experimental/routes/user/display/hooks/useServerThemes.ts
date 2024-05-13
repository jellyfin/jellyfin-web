import { useEffect, useMemo, useState } from 'react';

import themeManager from 'scripts/themeManager';
import { Theme } from 'types/webConfig';

export function useServerThemes() {
    const [themes, setThemes] = useState<Theme[]>();

    useEffect(() => {
        async function getServerThemes() {
            const loadedThemes = await themeManager.getThemes();

            setThemes(loadedThemes ?? []);
        }

        if (!themes) {
            void getServerThemes();
        }
    // We've intentionally left the dependency array here to ensure that the effect happens only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const defaultTheme = useMemo(() => {
        if (!themes) return null;
        return themes.find((theme) => theme.default);
    }, [themes]);

    return {
        themes: themes ?? [],
        defaultTheme
    };
}
