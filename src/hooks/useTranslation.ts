import { useCallback, useEffect, useState } from 'react';
import { useTranslation as useReactTranslation, type UseTranslationOptions } from 'react-i18next';
import i18n from '../i18n';
import { supportedLocales, type LocaleCode, defaultLocale } from '../lib/locale-config';
import { preloadLocale, getLocale } from '../lib/locale-loader';
import { logger } from '../utils/logger';

export { supportedLocales, LocaleCode } from '../lib/locale-config';

export interface UseJellyfinTranslationOptions extends UseTranslationOptions<string> {
    preload?: boolean;
}

interface TranslationResult {
    t: (key: string, options?: { [key: string]: string | number | boolean | undefined } | undefined) => string;
    i18n: typeof i18n;
    currentLanguage: string;
    changeLanguage: (lng: string) => Promise<void>;
    setLanguage: (code: LocaleCode) => Promise<void>;
    availableLanguages: typeof supportedLocales;
    isLoading: boolean;
}

export function useTranslation(options: UseJellyfinTranslationOptions = {}): TranslationResult {
    const { preload = false, ...reactOptions } = options;
    const { t, i18n: reactI18n } = useReactTranslation('common', reactOptions);
    const [isLoading, setIsLoading] = useState(false);

    const currentLanguage = i18n.language;
    const changeLanguage = useCallback(async (lng: string) => {
        setIsLoading(true);
        try {
            await i18n.changeLanguage(lng);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setLanguage = useCallback(async (code: LocaleCode) => {
        setIsLoading(true);
        try {
            await getLocale(code);
            await i18n.changeLanguage(code);
        } catch (error) {
            logger.error(`Failed to set language to ${code}`, { error, component: 'useTranslation' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (preload && currentLanguage !== defaultLocale) {
            preloadLocale(currentLanguage as LocaleCode);
        }
    }, [preload, currentLanguage]);

    return {
        t,
        i18n,
        currentLanguage,
        changeLanguage,
        setLanguage,
        availableLanguages: supportedLocales,
        isLoading
    };
}

export function useLanguageSelector() {
    const { currentLanguage, setLanguage, availableLanguages, isLoading } = useTranslation();

    const selectLanguage = useCallback(
        (code: LocaleCode) => {
            setLanguage(code);
        },
        [setLanguage]
    );

    return {
        currentLanguage,
        selectLanguage,
        availableLanguages,
        isLoading
    };
}

export type { TranslationResult };
