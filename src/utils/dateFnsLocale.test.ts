import { describe, expect, it } from 'vitest';
import * as dateFnsLocale from './dateFnsLocale';

describe('Utils: dateFnsLocale', () => {
    describe('Constant: LOCALE_MAP', () => {
        it.each([ ...new Set(Object.values(dateFnsLocale.LOCALE_MAP)) ])('Should have an importer for "%s"', async (localeName) => {
            const { code } = await dateFnsLocale.fetchLocale(localeName);
            expect(code).toEqual(localeName);
        });
    });

    describe('Function: fetchLocale', () => {
        it('Should reject a locale that has no importer', async () => {
            await expect(dateFnsLocale.fetchLocale('xx-XX')).rejects.toThrow('Unsupported date-fns locale: xx-XX');
        });
    });

    describe('Function: getLocale', () => {
        it('Should return "en-US" by default', () => {
            const { code } = dateFnsLocale.getLocale();
            expect(code).toEqual('en-US');
        });
    });

    describe('Function: getLocaleWithSuffix', () => {
        it('Should return "en-US" by default with addSuffix to true', () => {
            const { addSuffix, locale } = dateFnsLocale.getLocaleWithSuffix();

            expect(addSuffix).toEqual(true);
            expect(locale.code).toEqual('en-US');
        });
    });

    describe('Function: updateLocale', () => {
        it('Should import "fr-ca" locale', async () => {
            const expectedCode = 'fr-CA';

            await dateFnsLocale.updateLocale('fr-ca');
            const { code } = dateFnsLocale.getLocale();
            const { locale: localeWithSuffix } =
                dateFnsLocale.getLocaleWithSuffix();

            expect(code).toEqual(expectedCode);
            expect(localeWithSuffix.code).toEqual(expectedCode);
        });

        it('Should import "fr" locale', async () => {
            const expectedCode = 'fr';

            await dateFnsLocale.updateLocale('fr-fr');
            const { code } = dateFnsLocale.getLocale();
            const { locale: localeWithSuffix } =
                dateFnsLocale.getLocaleWithSuffix();

            expect(code).toEqual(expectedCode);
            expect(localeWithSuffix.code).toEqual(expectedCode);
        });

        it('Should import "en-US" locale if given locale is not found', async () => {
            const expectedCode = 'en-US';

            await dateFnsLocale.updateLocale('unknown-unknown');
            const { code } = dateFnsLocale.getLocale();
            const { locale: localeWithSuffix } =
                dateFnsLocale.getLocaleWithSuffix();

            expect(code).toEqual(expectedCode);
            expect(localeWithSuffix.code).toEqual(expectedCode);
        });
    });
});
