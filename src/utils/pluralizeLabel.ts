export const pluralizeLabel = (count: number, single: string) => {
    return `${single}${count === 1 ? '' : 's'}`;
};
