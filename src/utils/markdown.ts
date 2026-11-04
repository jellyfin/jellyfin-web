import markdownIt from 'markdown-it';

let instance: ReturnType<typeof markdownIt> | undefined;

/**
 * Returns a shared markdown-it renderer.
 * Construction compiles large regular expressions, which takes seconds on slow TV browsers.
 *
 * Warning: HTML in the markdown source is passed through unescaped, so the rendered output must be sanitized
 * (e.g. with DOMPurify) before it is inserted into the page.
 */
export function getMarkdown() {
    if (!instance) {
        // eslint-disable-next-line sonarjs/disabled-auto-escaping
        instance = markdownIt({ html: true });
    }
    return instance;
}
