/**
 * Key normalisation for the directory-scanning loaders in `moduleLoaders.ts`. It lives in its own
 * file so tests can import it without pulling in the loaders' dynamic imports.
 */

const MODULE_EXTENSION = /\.(?:[cm]?[jt]sx?|html|json)$/;

/**
 * Normalises a glob key or a runtime request into a lookup key: strips a query or hash, a
 * leading `./`, the extension, trailing slashes and a trailing `/index`, so that `quickConnect`
 * and `quickConnect/index` both resolve `quickConnect/index.tsx`.
 */
export const normalizeModuleKey = (modulePath: string): string => {
    let key = modulePath.replace(/\\/g, '/');

    const suffixIndex = key.search(/[?#]/);
    if (suffixIndex >= 0) key = key.slice(0, suffixIndex);

    if (key.startsWith('./')) key = key.slice(2);

    key = key.replace(MODULE_EXTENSION, '');
    while (key.endsWith('/')) key = key.slice(0, -1);

    if (key === 'index') return '';
    if (key.endsWith('/index')) key = key.slice(0, -'/index'.length);

    return key;
};
