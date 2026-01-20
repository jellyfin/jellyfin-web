export function getCardTextLines(lines: string[], cssClass: string, forceLines: boolean, isOuterFooter: boolean, _cardLayout: boolean, addRightMargin: boolean, maxLines?: number): string {
    let html = '';
    let valid = 0;

    for (const text of lines) {
        let currentCssClass = cssClass;
        if (valid > 0 && isOuterFooter) currentCssClass += ' cardText-secondary';
        else if (valid === 0 && isOuterFooter) currentCssClass += ' cardText-first';
        if (addRightMargin) currentCssClass += ' cardText-rightmargin';

        if (text) {
            html += `<div class='${currentCssClass}'><bdi>${text}</bdi></div>`;
            valid++;
            if (maxLines && valid >= maxLines) break;
        }
    }

    if (forceLines) {
        const linesLength = maxLines || lines.length;
        while (valid < linesLength) {
            html += `<div class='${cssClass}'>&nbsp;</div>`;
            valid++;
        }
    }

    return html;
}