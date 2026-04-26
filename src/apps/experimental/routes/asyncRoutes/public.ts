import { AsyncRoute } from 'components/router/AsyncRoute';
import { AppType } from 'constants/appType';

export const ASYNC_PUBLIC_ROUTES: AsyncRoute[] = [
    { path: 'addserver', type: AppType.Experimental }
];
