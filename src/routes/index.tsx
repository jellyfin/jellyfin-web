import { createRoute } from '@tanstack/react-router';
import ConnectionRequired from 'components/ConnectionRequired';
import { Route } from './__root';

export const indexRoute = createRoute({
    getParentRoute: () => Route,
    path: '/',
    component: IndexPage
});

function IndexPage() {
    return <ConnectionRequired level="public" />;
}
