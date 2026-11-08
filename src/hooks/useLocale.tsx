import type { Locale } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useEffect, useMemo, useState } from 'react';

import { getDefaultLanguage, normalizeLocaleName } from 'lib/globalize';
import { fetchLocale, normalizeLocale } from 'utils/dateFnsLocale';

import { useUserSettings } from './useUserSettings';

export function useLocale() {
    const { dateTimeLocale: dateTimeSetting, language } = useUserSettings();
    const [ dateFnsLocale, setDateFnsLocale ] = useState<Locale>(enUS);

    const locale: string = useMemo(() => (
        normalizeLocaleName(language || getDefaultLanguage())
    ), [ language ]);

    const dateTimeLocale: string = useMemo(() => (
        dateTimeSetting ? normalizeLocaleName(dateTimeSetting) : locale
    ), [ dateTimeSetting, locale ]);

    useEffect(() => {
        let isStale = false;

        const fetchDateFnsLocale = async () => {
            try {
                const dfLocale = await fetchLocale(normalizeLocale(dateTimeLocale));
                // Ignore responses for a locale that is no longer current
                if (!isStale) setDateFnsLocale(dfLocale);
            } catch (err) {
                console.warn('[useLocale] failed to fetch dateFns locale', err);
            }
        };

        void fetchDateFnsLocale();

        return () => {
            isStale = true;
        };
    }, [ dateTimeLocale ]);

    return {
        locale,
        dateTimeLocale,
        dateFnsLocale
    };
}
