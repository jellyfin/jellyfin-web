import { ThemeProvider } from '@mui/material/styles';
import React, { type FC, type PropsWithChildren, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { DASHBOARD_APP_PATHS } from 'apps/dashboard/routes/routes';
import { useUserTheme } from 'hooks/useUserTheme';

import { DEFAULT_THEME, getTheme } from './themes';

const isDashboardThemePage = (pathname: string) => [
    // NOTE: The metadata manager doesn't seem to use the dashboard theme
    DASHBOARD_APP_PATHS.Dashboard,
    DASHBOARD_APP_PATHS.PluginConfig
].some(path => pathname.startsWith(`/${path}`));

const UserThemeProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [ isDashboard, setIsDashboard ] = useState(false);
    const [ muiTheme, setMuiTheme ] = useState(DEFAULT_THEME);

    const location = useLocation();
    const { theme, dashboardTheme } = useUserTheme();

    // Check if we are on a dashboard page when the path changes
    useEffect(() => {
        setIsDashboard(isDashboardThemePage(location.pathname));
    }, [ location.pathname ]);

    useEffect(() => {
        if (isDashboard) {
            setMuiTheme(getTheme(dashboardTheme));
        } else {
            setMuiTheme(getTheme(theme));
        }
    }, [ dashboardTheme, isDashboard, theme ]);

    return (
        <ThemeProvider theme={muiTheme}>
            {children}
        </ThemeProvider>
    );
};

export default UserThemeProvider;
