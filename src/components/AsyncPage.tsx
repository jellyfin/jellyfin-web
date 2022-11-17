import loadable from '@loadable/component';

interface AsyncPageProps {
    /** The relative path to the page component in the routes directory. */
    page: string
}

/**
 * Page component that uses the loadable component library to load pages defined in the routes directory asynchronously
 * with code splitting.
 */
const AsyncPage = loadable(
    (props: AsyncPageProps) => import(/* webpackChunkName: "[request]" */ `../routes/${props.page}`),
    { cacheKey: (props: AsyncPageProps) => props.page }
);

export default AsyncPage;
