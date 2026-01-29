import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { defaultLocale, getLocaleCode, localeCodes } from './lib/locale-config';
import { getLocale, type TranslationDict } from './lib/locale-loader';
import { logger } from './utils/logger';

interface JellyfinBackendOptions {
    interpolation?: {
        escapeValue: boolean;
    };
}

class JellyfinBackend {
    public static readonly type = 'backend' as const;
    public options: JellyfinBackendOptions = {};

    public init(options: JellyfinBackendOptions = {}): void {
        this.options = options;
    }

    public async read(language: string, _namespace: string): Promise<TranslationDict | undefined> {
        try {
            const locale = getLocaleCode(language);
            return await getLocale(locale);
        } catch (error) {
            logger.error(
                `Failed to load translations for ${language}:`,
                { component: 'i18n' },
                error as Error
            );
            return undefined;
        }
    }

    public create(
        languages: readonly string[],
        _namespace: string,
        key: string,
        _fallbackValue: string
    ): void {
        for (const lang of languages) {
            logger.warn(`Missing translation key "${key}" for locale "${lang}"`, {
                component: 'i18n'
            });
        }
    }
}

void i18n
    .use(JellyfinBackend)
    .use(initReactI18next)
    .init({
        fallbackLng: defaultLocale,
        debug: import.meta.env.DEV,
        supportedLngs: localeCodes,
        defaultNS: 'common',
        ns: ['common'],
        load: 'currentOnly',
        preload: [defaultLocale],

        interpolation: {
            escapeValue: false
        },

        react: {
            useSuspense: false
        }
    });

export default i18n;

export { defaultLocale, localeCodes };
