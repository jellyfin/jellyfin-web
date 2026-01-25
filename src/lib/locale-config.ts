export const supportedLocales = [
    { code: 'en', name: 'English', file: 'en_US' },
    { code: 'en-GB', name: 'English (UK)', file: 'en-gb' },
    { code: 'af', name: 'Afrikaans', file: 'af' },
    { code: 'ar', name: 'Arabic', file: 'ar' },
    { code: 'be-BY', name: 'Belarusian', file: 'be-by' },
    { code: 'bg-BG', name: 'Bulgarian', file: 'bg-bg' },
    { code: 'bn-BD', name: 'Bengali (Bangladesh)', file: 'bn_BD' },
    { code: 'bn', name: 'Bengali', file: 'bn' },
    { code: 'ca', name: 'Catalan', file: 'ca' },
    { code: 'ckb', name: 'Kurdish (Sorani)', file: 'ckb' },
    { code: 'cs', name: 'Czech', file: 'cs' },
    { code: 'cy', name: 'Welsh', file: 'cy' },
    { code: 'da', name: 'Danish', file: 'da' },
    { code: 'de', name: 'German', file: 'de' },
    { code: 'el', name: 'Greek', file: 'el' },
    { code: 'es', name: 'Spanish', file: 'es' },
    { code: 'es-419', name: 'Spanish (Latin America)', file: 'es-419' },
    { code: 'et', name: 'Estonian', file: 'et' },
    { code: 'eu', name: 'Basque', file: 'eu' },
    { code: 'fa', name: 'Persian', file: 'fa' },
    { code: 'fi', name: 'Finnish', file: 'fi' },
    { code: 'fr', name: 'French', file: 'fr' },
    { code: 'gl', name: 'Galician', file: 'gl' },
    { code: 'gsw', name: 'Swiss German', file: 'gsw' },
    { code: 'he', name: 'Hebrew', file: 'he' },
    { code: 'hi-IN', name: 'Hindi (India)', file: 'hi-IN' },
    { code: 'hr', name: 'Croatian', file: 'hr' },
    { code: 'hu', name: 'Hungarian', file: 'hu' },
    { code: 'hy', name: 'Armenian', file: 'hy' },
    { code: 'id', name: 'Indonesian', file: 'id' },
    { code: 'is', name: 'Icelandic', file: 'is' },
    { code: 'it', name: 'Italian', file: 'it' },
    { code: 'ja', name: 'Japanese', file: 'ja' },
    { code: 'ko', name: 'Korean', file: 'ko' },
    { code: 'lt', name: 'Lithuanian', file: 'lt' },
    { code: 'lv', name: 'Latvian', file: 'lv' },
    { code: 'mk', name: 'Macedonian', file: 'mk' },
    { code: 'ml', name: 'Malayalam', file: 'ml' },
    { code: 'ms', name: 'Malay', file: 'ms' },
    { code: 'nb', name: 'Norwegian Bokmål', file: 'nb' },
    { code: 'nl', name: 'Dutch', file: 'nl' },
    { code: 'nn', name: 'Norwegian Nynorsk', file: 'nn' },
    { code: 'pl', name: 'Polish', file: 'pl' },
    { code: 'pr', name: 'Portuguese (Brazilian)', file: 'pr' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', file: 'pt-BR' },
    { code: 'pt-PT', name: 'Portuguese (Portugal)', file: 'pt-PT' },
    { code: 'ro', name: 'Romanian', file: 'ro' },
    { code: 'ru', name: 'Russian', file: 'ru' },
    { code: 'sk', name: 'Slovak', file: 'sk' },
    { code: 'sl', name: 'Slovenian', file: 'sl' },
    { code: 'sq', name: 'Albanian', file: 'sq' },
    { code: 'sr', name: 'Serbian', file: 'sr' },
    { code: 'sv', name: 'Swedish', file: 'sv' },
    { code: 'sw', name: 'Swahili', file: 'sw' },
    { code: 'ta', name: 'Tamil', file: 'ta' },
    { code: 'te', name: 'Telugu', file: 'te' },
    { code: 'th', name: 'Thai', file: 'th' },
    { code: 'tr', name: 'Turkish', file: 'tr' },
    { code: 'uk', name: 'Ukrainian', file: 'uk' },
    { code: 'uz', name: 'Uzbek', file: 'uz' },
    { code: 'vi', name: 'Vietnamese', file: 'vi' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', file: 'zh-CN' },
    { code: 'zh-HK', name: 'Chinese (Hong Kong)', file: 'zh-HK' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', file: 'zh-TW' }
] as const;

export type LocaleCode = (typeof supportedLocales)[number]['code'];

export const defaultLocale: LocaleCode = 'en';

export function getLocaleCode(code: string): LocaleCode {
    const normalized = code.toLowerCase().replace('_', '-');
    const found = supportedLocales.find(l => l.code.toLowerCase() === normalized);
    return found?.code ?? defaultLocale;
}

export function isSupportedLocale(code: string): boolean {
    return supportedLocales.some(l => l.code.toLowerCase() === code.toLowerCase());
}

export function getLocaleFile(code: LocaleCode): string {
    const locale = supportedLocales.find(l => l.code === code);
    return locale?.file ?? 'en_US';
}

export const localeCodes = supportedLocales.map(l => l.code) as readonly LocaleCode[];
