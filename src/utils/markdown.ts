import markdownIt from 'markdown-it';

let instance: ReturnType<typeof markdownIt> | undefined;

/**
 * Returns a shared markdown-it renderer.
 * Construction compiles large regular expressions, which takes seconds on slow TV browsers.
 */
export function getMarkdown() {
    if (!instance) {
        // Callers sanitize the rendered HTML with DOMPurify
        // eslint-disable-next-line sonarjs/disabled-auto-escaping
        instance = markdownIt({ html: true });
    }
    return instance;
}
