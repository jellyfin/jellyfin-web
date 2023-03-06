/**
 * Checks if the list includes any value from the search.
 * @param list The list to search in.
 * @param search The values to search.
 * @returns _true_ if the list includes any value from the search.
 * @remarks The list (string) can start with '-', in which case the logic is inverted.
 */
export function includesAny(list: string | string[] | null | undefined, search: string | string[]): boolean {
    if (!list) {
        return true;
    }

    let inverseMatch = false;

    if (typeof list === 'string') {
        if (list.startsWith('-')) {
            inverseMatch = true;
            list = list.substring(1);
        }

        list = list.split(',');
    }

    list = list.filter(i => i);

    if (!list.length) {
        return true;
    }

    if (typeof search === 'string') {
        search = search.split(',');
    }

    search = search.filter(i => i);

    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    if (search.some(s => list!.includes(s))) {
        return !inverseMatch;
    }

    return inverseMatch;
}
