/**
 * Trims whitespace and removes trailing slashes from a server address. Does not add a protocol, since
 * connectToAddress tries https and http itself. Returns '' for blank input.
 */
export const normalizeServerAddress = (input: string) => {
    const address = input.trim();

    // Counts the slashes instead of matching them with a regex, which sonarjs reports as slow
    let end = address.length;
    while (end > 0 && address[end - 1] === '/') end--;

    return address.slice(0, end);
};
