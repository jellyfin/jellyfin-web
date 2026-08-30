import { LibraryTab } from 'types/libraryTab';

export interface AlphabetPickerGroup {
    id: string;
    values: string[];
}

interface AlphabetDefinition extends AlphabetPickerGroup {
    localePrefixes: string[];
    script: string;
}

export interface AlphabetNavigationSettings {
    enabled: boolean;
    locale: string;
    additionalScripts: string[];
}

interface AlphabetNavigationSystemInfo {
    EnableLocalizedAlphabetNavigation?: boolean;
    LocalizedAlphabetLocale?: string | null;
    LocalizedAlphabetAdditionalScripts?: string[] | null;
}

interface LegacyAlphabetQuery {
    nameLessThan?: string;
    nameStartsWith?: string;
}

interface AlphabetFilter {
    query: LegacyAlphabetQuery;
    params?: Record<string, string>;
}

const LATIN: AlphabetDefinition = {
    id: 'latin',
    script: 'Latn',
    localePrefixes: [],
    values: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
};

const GREEK: AlphabetDefinition = {
    id: 'greek',
    script: 'Grek',
    localePrefixes: ['el'],
    values: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'.split('')
};

const CYRILLIC_RU: AlphabetDefinition = {
    id: 'cyrillic-ru',
    script: 'Cyrl',
    localePrefixes: ['ru'],
    values: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')
};

const CYRILLIC_UK: AlphabetDefinition = {
    id: 'cyrillic-uk',
    script: 'Cyrl',
    localePrefixes: ['uk'],
    values: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ'.split('')
};

const CYRILLIC_BE: AlphabetDefinition = {
    id: 'cyrillic-be',
    script: 'Cyrl',
    localePrefixes: ['be'],
    values: 'АБВГДЕЁЖЗІЙКЛМНОПРСТУЎФХЦЧШЫЬЭЮЯ'.split('')
};

const CYRILLIC_BG: AlphabetDefinition = {
    id: 'cyrillic-bg',
    script: 'Cyrl',
    localePrefixes: ['bg'],
    values: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ'.split('')
};

const DEFINITIONS = [GREEK, CYRILLIC_RU, CYRILLIC_UK, CYRILLIC_BE, CYRILLIC_BG, LATIN];

// Only locales whose alphabet can be represented safely by A-Z should use the
// Latin picker implicitly. Unknown locales remain on the legacy picker until a
// proper alphabet definition is added.
const LATIN_LOCALE_PREFIXES = new Set([
    'af', 'az', 'br', 'bs', 'ca', 'ch', 'cs', 'cy', 'da', 'de', 'en', 'eo',
    'es', 'et', 'eu', 'fi', 'fil', 'fo', 'fr', 'ga', 'gl', 'hr', 'hu', 'id',
    'is', 'it', 'lb', 'lt', 'lv', 'ms', 'mt', 'nb', 'nl', 'nn', 'pl', 'pt',
    'ro', 'sk', 'sl', 'sq', 'sv', 'sw', 'tr', 'uz', 'vi'
]);

// Additional scripts need a single unambiguous alphabet definition. Some
// scripts (for example Cyrillic) differ by locale, so they should not be
// guessed here until the UI can select a concrete alphabet definition.
const ADDITIONAL_DEFINITIONS: Record<string, AlphabetDefinition> = {
    Latn: LATIN
};

const LOCALIZED_ALPHABET_VIEW_TYPES = new Set<LibraryTab>([
    LibraryTab.Albums,
    LibraryTab.AlbumArtists,
    LibraryTab.Artists,
    LibraryTab.Books,
    LibraryTab.Collections,
    LibraryTab.Episodes,
    LibraryTab.Favorites,
    LibraryTab.Folders,
    LibraryTab.Genres,
    LibraryTab.Mixed,
    LibraryTab.Movies,
    LibraryTab.MusicVideos,
    LibraryTab.PhotoAlbums,
    LibraryTab.Photos,
    LibraryTab.Playlists,
    LibraryTab.Series,
    LibraryTab.Songs,
    LibraryTab.Studios,
    LibraryTab.Videos
]);

const normalizeLocale = (locale: string) => locale.replace(/_/g, '-').toLowerCase();

const getLegacyAlphabetQuery = (alphabet?: string | null): LegacyAlphabetQuery => ({
    nameLessThan: alphabet === '#' ? 'A' : undefined,
    nameStartsWith: alphabet === '#' ? undefined : (alphabet ?? undefined)
});

export const getAlphabetNavigationSettings = (
    systemInfo?: unknown
): AlphabetNavigationSettings => {
    const info = systemInfo as AlphabetNavigationSystemInfo | undefined;
    return {
        enabled: Boolean(info?.EnableLocalizedAlphabetNavigation),
        locale: info?.LocalizedAlphabetLocale ?? '',
        additionalScripts: info?.LocalizedAlphabetAdditionalScripts ?? []
    };
};

export const getPrimaryAlphabetDefinition = (locale: string): AlphabetPickerGroup | undefined => {
    const normalizedLocale = normalizeLocale(locale);
    const definition = DEFINITIONS.find(candidate =>
        candidate.localePrefixes.some(prefix =>
            normalizedLocale === prefix || normalizedLocale.startsWith(`${prefix}-`)
        )
    );

    if (definition) {
        return definition;
    }

    const localeParts = normalizedLocale.split('-');
    if (localeParts.includes('latn') || LATIN_LOCALE_PREFIXES.has(localeParts[0])) {
        return LATIN;
    }

    return undefined;
};

export const supportsLocalizedAlphabetNavigation = (
    viewType: LibraryTab,
    settings: AlphabetNavigationSettings
) => LOCALIZED_ALPHABET_VIEW_TYPES.has(viewType)
    && Boolean(getPrimaryAlphabetDefinition(settings.locale));

const getEnabledAlphabets = (
    settings: AlphabetNavigationSettings,
    viewType: LibraryTab
): AlphabetDefinition[] => {
    if (!settings.enabled || !supportsLocalizedAlphabetNavigation(viewType, settings)) {
        return [];
    }

    const primary = getPrimaryAlphabetDefinition(settings.locale);
    if (!primary) {
        return [];
    }

    const primaryDefinition = DEFINITIONS.find(definition => definition.id === primary.id);
    if (!primaryDefinition) {
        return [];
    }

    const definitions = [primaryDefinition];
    for (const script of settings.additionalScripts) {
        const definition = ADDITIONAL_DEFINITIONS[script];
        if (definition && !definitions.some(candidate => candidate.id === definition.id)) {
            definitions.push(definition);
        }
    }

    return definitions;
};

export const getLocalizedAlphabetGroups = (
    settings: AlphabetNavigationSettings,
    viewType: LibraryTab
): AlphabetPickerGroup[] | undefined => {
    const enabled = getEnabledAlphabets(settings, viewType);
    return enabled.length > 0 ?
        enabled.map(({ id, values }) => ({ id, values })) :
        undefined;
};

export const getAlphabetFilter = (
    selectedAlphabet: string | null | undefined,
    settings: AlphabetNavigationSettings,
    viewType: LibraryTab
): AlphabetFilter => {
    const enabled = getEnabledAlphabets(settings, viewType);
    if (enabled.length === 0) {
        return { query: getLegacyAlphabetQuery(selectedAlphabet) };
    }

    const orderedInitials = [...new Set(enabled.flatMap(alphabet => alphabet.values))];
    const params: Record<string, string> = {
        nameInitialSortOrder: orderedInitials.join(',')
    };

    if (!selectedAlphabet) {
        return { query: {}, params };
    }

    if (selectedAlphabet === '#') {
        params.excludeNameInitials = orderedInitials.join(',');
        return { query: {}, params };
    }

    if (orderedInitials.includes(selectedAlphabet)) {
        params.nameInitials = selectedAlphabet;
    }

    return { query: {}, params };
};
