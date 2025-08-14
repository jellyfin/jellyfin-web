import {
    type SupportedColorScheme,
    ThemeProvider,
    useColorScheme
} from '@mui/material/styles';
import React, {
    type FC,
    type PropsWithChildren,
    useState,
    useEffect
} from 'react';
import { useLocation } from 'react-router-dom';

import { DASHBOARD_APP_PATHS } from 'apps/dashboard/routes/routes';
import { useUserTheme } from 'hooks/useUserTheme';

import appTheme, { COLOR_SCHEMES } from './themes';

const isDashboardThemePage = (pathname: string) =>
    [
        // NOTE: The metadata manager doesn't seem to use the dashboard theme
        DASHBOARD_APP_PATHS.Dashboard,
        DASHBOARD_APP_PATHS.PluginConfig
    ].some((path) => pathname.startsWith(`/${path}`));

const ColorSchemeSwitcher: FC = () => {
    const [isDashboard, setIsDashboard] = useState(false);
    const { setColorScheme, setMode } = useColorScheme();
    const location = useLocation();
    const { theme, dashboardTheme } = useUserTheme();

    // Check if we are on a dashboard page when the path changes
    useEffect(() => {
        setIsDashboard(isDashboardThemePage(location.pathname));
    }, [location.pathname]);

    useEffect(() => {
        const currentSchemeName = (
            isDashboard ? dashboardTheme : theme
        ) as SupportedColorScheme;
        const currentScheme = COLOR_SCHEMES[currentSchemeName];

        setColorScheme(currentSchemeName);
        setMode(currentScheme.palette?.mode || 'dark');
    }, [dashboardTheme, isDashboard, setColorScheme, setMode, theme]);

    return null;
};

const UserThemeProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    return (
        <ThemeProvider theme={appTheme} defaultMode='dark'>
            <ColorSchemeSwitcher />
            {children}
        </ThemeProvider>
    );
};

export default UserThemeProvider;
