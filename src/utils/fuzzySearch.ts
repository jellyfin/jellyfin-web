/**
 * Fuzzy search utilities for matching text with typo tolerance.
 * Uses Levenshtein distance for edit-distance comparison and supports
 * word-order-independent matching.
 */

/** Default maximum edit distance for typo tolerance */
const DEFAULT_TYPO_THRESHOLD = 2;

/**
 * Calculates the Levenshtein distance between two strings.
 * This is the minimum number of single-character edits (insertions,
 * deletions, or substitutions) required to transform string `a` into string `b`.
 *
 * @param a - First string
 * @param b - Second string
 * @returns The edit distance between the two strings
 *
 * @example
 * levenshtein('kitten', 'sitting') // returns 3
 * levenshtein('book', 'back') // returns 2
 */
export function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    // Use two rows instead of full matrix for memory efficiency
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    let curr = new Array<number>(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1, // deletion
                curr[j - 1] + 1, // insertion
                prev[j - 1] + cost // substitution
            );
        }
        [prev, curr] = [curr, prev];
    }
    return prev[b.length];
}

/**
 * Finds the best fuzzy match for a query word among a list of text words.
 * Returns a tuple of [matched, score] where score is higher for better matches.
 *
 * Scoring:
 * - Exact match: 100
 * - Prefix match: 80
 * - Contains match: 60
 * - Typo match (within threshold): 40 - (distance * 10)
 *
 * @param queryWord - The word to search for
 * @param textWords - Array of words to search within
 * @param typoThreshold - Maximum edit distance for typo tolerance
 * @returns Tuple of [matched: boolean, score: number]
 */
export function findBestMatch(
    queryWord: string,
    textWords: string[],
    typoThreshold = DEFAULT_TYPO_THRESHOLD
): [boolean, number] {
    let bestScore = -1;

    for (const textWord of textWords) {
        // Exact match
        if (textWord === queryWord) {
            return [true, 100];
        }

        // Prefix match (query is start of text word)
        if (textWord.startsWith(queryWord)) {
            bestScore = Math.max(bestScore, 80);
            continue;
        }

        // Contains match
        if (textWord.includes(queryWord)) {
            bestScore = Math.max(bestScore, 60);
            continue;
        }

        // Typo tolerance via Levenshtein (only for words of similar length)
        if (Math.abs(queryWord.length - textWord.length) <= typoThreshold) {
            const distance = levenshtein(queryWord, textWord);
            if (distance <= typoThreshold) {
                bestScore = Math.max(bestScore, 40 - distance * 10);
            }
        }
    }

    return [bestScore >= 0, bestScore];
}

export interface FuzzyMatchOptions {
    /** Maximum edit distance for typo tolerance (default: 2) */
    typoThreshold?: number;
    /** Bonus points for shorter text matches (default: true) */
    preferShorterMatches?: boolean;
}

/**
 * Performs fuzzy matching to check if all query words match the text.
 * Words can appear in any order and are matched with typo tolerance.
 *
 * @param text - The text to search within
 * @param queryWords - Array of query words (should be lowercased)
 * @param options - Configuration options
 * @returns A score (higher = better match), or -1 if no match
 *
 * @example
 * // Word order independent matching
 * fuzzyMatch('Stargate Universe', ['universe', 'stargate']) // returns positive score
 *
 * // Typo tolerance
 * fuzzyMatch('Stargate', ['stargat']) // returns positive score (1 edit away)
 *
 * // No match
 * fuzzyMatch('Star Wars', ['trek']) // returns -1
 */
export function fuzzyMatch(
    text: string,
    queryWords: string[],
    options: FuzzyMatchOptions = {}
): number {
    const {
        typoThreshold = DEFAULT_TYPO_THRESHOLD,
        preferShorterMatches = true
    } = options;

    const textWords = text.toLowerCase().split(/\s+/);
    let totalScore = 0;

    for (const queryWord of queryWords) {
        const [matched, score] = findBestMatch(queryWord, textWords, typoThreshold);
        if (!matched) return -1;
        totalScore += score;
    }

    // Bonus for shorter names (more precise matches)
    if (preferShorterMatches) {
        totalScore += Math.max(0, 20 - text.length / 3);
    }

    return totalScore;
}

/**
 * Parses a search query string into normalized query words.
 *
 * @param query - The raw search query
 * @returns Array of lowercase, non-empty query words
 *
 * @example
 * parseQueryWords('  Universe  Stargate  ') // returns ['universe', 'stargate']
 */
export function parseQueryWords(query: string): string[] {
    return query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
}

/**
 * Filters and scores an array of items using fuzzy matching.
 *
 * @param items - Array of items to filter
 * @param getText - Function to extract searchable text from an item
 * @param queryWords - Array of query words to match against
 * @param options - Fuzzy match options
 * @returns Array of items sorted by match score (best first)
 *
 * @example
 * const movies = [{ name: 'Star Wars' }, { name: 'Stargate' }];
 * filterByFuzzyMatch(movies, m => m.name, ['star'])
 * // returns both, sorted by score
 */
export function filterByFuzzyMatch<T>(
    items: T[],
    getText: (item: T) => string,
    queryWords: string[],
    options: FuzzyMatchOptions = {}
): T[] {
    if (queryWords.length === 0) return [];

    return items
        .map(item => ({
            item,
            score: fuzzyMatch(getText(item) || '', queryWords, options)
        }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
}
