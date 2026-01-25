import { escapeHtml } from '../../../utils/html';
import { appRouter } from '../../../components/router/appRouter';
import globalize from 'lib/globalize';
import { hideAll } from '../utils/viewHelpers';

export function renderOverview(page, item) {
    const overviewElements = page.querySelectorAll('.overview');

    if (overviewElements.length > 0) {
        const overviewText = item.Overview || '';

        if (overviewText) {
            // For now, use escaped HTML until we convert this to React
            // TODO: Convert to React component using ReactMarkdownBox
            const escapedOverview = escapeHtml(overviewText);

            for (const overviewElement of overviewElements) {
                overviewElement.innerHTML = '<bdi>' + escapedOverview.replace(/\n/g, '<br>') + '</bdi>';
                overviewElement.classList.remove('hide');
                overviewElement.classList.add('detail-clamp-text');

                const expandButton = overviewElement.parentElement.querySelector('.overview-expand');

                if (overviewElement.scrollHeight - overviewElement.offsetHeight > 2) {
                    expandButton.classList.remove('hide');
                } else {
                    expandButton.classList.add('hide');
                }

                expandButton.addEventListener('click', toggleLineClamp.bind(null, overviewElement));
            }
        } else {
            for (const overviewElement of overviewElements) {
                overviewElement.innerHTML = '';
                overviewElement.classList.add('hide');
            }
        }
    }
}

function toggleLineClamp(clampTarget, e) {
    clampTarget.classList.toggle('detail-clamp-text-expanded');
    e.preventDefault();
    return false;
}
