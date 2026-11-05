import DOMPurify from 'dompurify';
import markdownIt from 'markdown-it';

let instance: markdownIt | undefined;

/**
 * Returns a shared markdown-it renderer.
 * Construction compiles large regular expressions, which is slow on older devices.
 */
function getMarkdown() {
    // eslint-disable-next-line sonarjs/disabled-auto-escaping
    instance ??= markdownIt({ html: true });
    return instance;
}

type MarkdownToHtmlOptions = {
    domPurify?: typeof DOMPurify
};

/**
 * Converts markdown to HTML.
 * @param markdownValue The markdown string to convert.
 * @returns The resulting HTML string.
 */
export function markdownToHtml(markdownValue: string, options?: MarkdownToHtmlOptions) {
    const markdown = getMarkdown();
    const htmlValue = markdown.render(markdownValue);

    // HTML in the markdown source is passed through unescaped, so the rendered output must be sanitized
    const sanitizedValue = (options?.domPurify || DOMPurify).sanitize(htmlValue);
    return sanitizedValue;
}
