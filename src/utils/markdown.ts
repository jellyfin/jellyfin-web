import markdownIt from 'markdown-it';

let instance: markdownIt | undefined;

/**
 * Returns a shared markdown-it renderer.
 * Construction compiles large regular expressions, which is slow on older devices.
 *
 * Warning: HTML in the markdown source is passed through unescaped, so the rendered output must be sanitized
 * (e.g. with DOMPurify) before it is inserted into the page.
 * @returns The shared markdown-it instance.
 */
export function getMarkdown() {
    // eslint-disable-next-line sonarjs/disabled-auto-escaping
    instance ??= markdownIt({ html: true });
    return instance;
}
