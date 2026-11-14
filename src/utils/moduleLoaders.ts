/**
 * Loaders for modules that are selected by name at runtime: route pages, legacy view controllers
 * and their HTML views, built-in plugins, translation files and Live TV provider editors.
 */

import type { ComponentType } from 'react';

/** A lazily imported React Router route module (the page component as the default export). */
export interface RouteModule {
    default: ComponentType
    [exportName: string]: unknown
}

/** A legacy view controller module (a constructor as the default export). */
export interface ControllerModule {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: new (...args: any[]) => any
    [exportName: string]: unknown
}

/** A built-in plugin module (a plugin constructor as the default export). */
export interface PluginModule {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: new (...args: any[]) => any
    [exportName: string]: unknown
}

/** An HTML template processed by `html-loader` (the markup as the default export). */
export interface HtmlModule {
    default: string
}

/** A translation file (`strings/<culture>.json`): translation keys mapped to strings. */
export interface StringsModule {
    default: Record<string, string>
    [key: string]: unknown
}

/** Loads a dashboard route page from `apps/dashboard/routes`. */
export const importDashboardRoute = (page: string): Promise<RouteModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/dashboard/routes/${page}`);

/** Loads an experimental (modern) route page from `apps/modern/routes`. */
export const importModernRoute = (page: string): Promise<RouteModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/modern/routes/${page}`);

/** Loads a legacy route page from `apps/legacy/routes`. */
export const importLegacyRoute = (page: string): Promise<RouteModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/legacy/routes/${page}`);

/** Loads a view controller from `apps/dashboard/controllers`. */
export const importDashboardController = (name: string): Promise<ControllerModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/dashboard/controllers/${name}`);

/** Loads an HTML view (`name` includes the `.html` extension) from `apps/dashboard/controllers`. */
export const importDashboardView = (name: string): Promise<HtmlModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/dashboard/controllers/${name}`);

/** Loads a view controller from `apps/wizard/controllers`. */
export const importWizardController = (name: string): Promise<ControllerModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/wizard/controllers/${name}`);

/** Loads an HTML view (`name` includes the `.html` extension) from `apps/wizard/controllers`. */
export const importWizardView = (name: string): Promise<HtmlModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/wizard/controllers/${name}`);

/**
 * Loads a view controller from `apps/legacy/controllers`. Tab controllers in subdirectories pass
 * the directory prefix, for example `music/musicartists`.
 */
export const importLegacyController = (name: string): Promise<ControllerModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/legacy/controllers/${name}`);

/** Loads an HTML view (`name` includes the `.html` extension) from `apps/legacy/controllers`. */
export const importLegacyView = (name: string): Promise<HtmlModule> =>
    import(/* webpackChunkName: "[request]" */ `../apps/legacy/controllers/${name}`);

/** Loads a built-in plugin, for example `playAccessValidation/plugin`. */
export const importPlugin = (spec: string): Promise<PluginModule> =>
    import(/* webpackChunkName: "[request]" */ `../plugins/${spec}`);

/** Loads a translation file, for example `en-us.json`. */
export const importStrings = (file: string): Promise<StringsModule> =>
    import(/* webpackChunkName: "[request]" */ `../strings/${file}`);

/** Loads a Live TV guide provider editor, for example `xmltv`. */
export const importTvProvider = (type: string): Promise<ControllerModule> =>
    import(`../components/tvproviders/${type}`);

/** Loads the HTML template of a Live TV guide provider editor. */
export const importTvProviderTemplate = (type: string): Promise<HtmlModule> =>
    import(`../components/tvproviders/${type}.template.html`);
