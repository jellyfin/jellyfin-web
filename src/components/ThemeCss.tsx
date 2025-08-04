import React, { type FC, useEffect, useState } from 'react';

import { useUserTheme } from 'hooks/useUserTheme';
import { getDefaultTheme } from 'scripts/settings/webSettings';

interface ThemeCssProps {
    dashboard?: boolean;
}

const getThemeUrl = (id: string) => `themes/${id}/theme.css`;

const DEFAULT_THEME_URL = getThemeUrl(getDefaultTheme().id);

const ThemeCss: FC<ThemeCssProps> = ({ dashboard = false }) => {
    const { theme, dashboardTheme } = useUserTheme();
    const [themeUrl, setThemeUrl] = useState(DEFAULT_THEME_URL);

    useEffect(() => {
        const id = dashboard ? dashboardTheme : theme;
        if (id) setThemeUrl(getThemeUrl(id));
    }, [dashboard, dashboardTheme, theme]);

    return <link rel='stylesheet' type='text/css' href={themeUrl} />;
};

export default ThemeCss;
