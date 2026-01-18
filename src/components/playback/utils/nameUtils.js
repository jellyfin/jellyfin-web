import { t } from 'lib/globalize';

export function normalizeName(t: string) {
    return t.toLowerCase().replace(' ', '');
}
