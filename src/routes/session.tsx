import { createRoute } from '@tanstack/react-router';
import { Login } from 'apps/stable/routes/session/login/Login';
import { SelectServer } from 'apps/stable/routes/session/selectServer/SelectServer';
import ConnectionRequired from 'components/ConnectionRequired';
import ServerSelection from 'components/ServerSelection';
import { Box, Text } from 'ui-primitives';
import { Route } from './__root';

export const testRoute = createRoute({
    getParentRoute: () => Route,
    path: 'test',
    component: Login
});

export const loginRoute = createRoute({
    getParentRoute: () => Route,
    path: 'login',
    component: Login
});

const SelectServerPage = () => {
    // Show the server list component for server selection
    return <SelectServer />;
};

export const selectServerRoute = createRoute({
    getParentRoute: () => Route,
    path: 'selectserver',
    component: SelectServerPage
});

export const forgotPasswordPinRoute = createRoute({
    getParentRoute: () => Route,
    path: 'forgotpasswordpin',
    component: () => (
        <Box>
            <Text>Forgot Password PIN page - placeholder</Text>
        </Box>
    )
});
