import { PluginCategory } from './pluginCategory';

/** A mapping of category names used by the plugin repository to translation keys. */
export const CATEGORY_LABELS: Record<PluginCategory, string> = {
    [PluginCategory.Administration]: 'HeaderAdmin',
    [PluginCategory.General]: 'General',
    [PluginCategory.Anime]: 'Anime',
    [PluginCategory.Books]: 'Books',
    [PluginCategory.LiveTV]: 'LiveTV',
    [PluginCategory.MoviesAndShows]: 'MoviesAndShows',
    [PluginCategory.Music]: 'TabMusic',
    [PluginCategory.Subtitles]: 'Subtitles',
    [PluginCategory.Other]: 'Other'
};
