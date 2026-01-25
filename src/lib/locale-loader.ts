import { getLocaleFile, type LocaleCode } from './locale-config';

type TranslationDict = Record<string, string>;

const localeCache = new Map<string, TranslationDict>();
const loadingPromises = new Map<string, Promise<TranslationDict>>();

async function loadLocaleFile(file: string): Promise<TranslationDict> {
    const response = await fetch(`/locales/${file}.json`);
    if (!response.ok) {
        throw new Error(`Failed to load locale file: ${file}`);
    }
    return response.json();
}

export async function getLocale(locale: LocaleCode): Promise<TranslationDict> {
    if (localeCache.has(locale)) {
        return localeCache.get(locale)!;
    }

    if (loadingPromises.has(locale)) {
        return loadingPromises.get(locale)!;
    }

    const file = getLocaleFile(locale).replace('_', '-').toLowerCase();

    const loadPromise = loadLocaleFile(file)
        .then(translations => {
            localeCache.set(locale, translations);
            loadingPromises.delete(locale);
            return translations;
        })
        .catch(error => {
            loadingPromises.delete(locale);
            throw error;
        });

    loadingPromises.set(locale, loadPromise);
    return loadPromise;
}

export function preloadLocale(locale: LocaleCode): void {
    if (!localeCache.has(locale) && !loadingPromises.has(locale)) {
        getLocale(locale).catch(() => {
            // ignore
        });
    }
}

export function clearLocaleCache(): void {
    localeCache.clear();
}

export function isLocaleLoaded(locale: string): boolean {
    return localeCache.has(locale);
}

export type { TranslationDict };
