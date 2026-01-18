export function getCardTextLines(lines, cssClass, forceLines, isOuterFooter, cardLayout, addRightMargin, maxLines) {
    let html = '';
    let valid = 0;

    for (const text of lines) {
        let currentCssClass = cssClass;

        if (valid > 0 && isOuterFooter) {
            currentCssClass += ' cardText-secondary';
        } else if (valid === 0 && isOuterFooter) {
            currentCssClass += ' cardText-first';
        }

        if (addRightMargin) {
            currentCssClass += ' cardText-rightmargin';
        }

        if (text) {
            html += "<div class='" + currentCssClass + "'>";
            html += '<bdi>' + text + '</bdi>';
            html += '</div>';
            valid++;

            if (maxLines && valid >= maxLines) {
                break;
            }
        }
    }

    if (forceLines) {
        const linesLength = maxLines || Math.min(lines.length, maxLines || lines.length);

        while (valid < linesLength) {
            html += "<div class='" + cssClass + "'>&nbsp;</div>";
            valid++;
        }
    }

    return html;
}
