import DOMPurify from 'dompurify';
import markdownIt from 'markdown-it';
import { appRouter } from '../../../components/router/appRouter';
import globalize from 'lib/globalize';
import { hideAll } from '../utils/viewHelpers';

export function renderOverview(page, item) {
    const overviewElements = page.querySelectorAll('.overview');

    if (overviewElements.length > 0) {
        const overview = DOMPurify.sanitize(markdownIt({ html: true }).render(item.Overview || ''));

        if (overview) {
            for (const overviewElement of overviewElements) {
                overviewElement.innerHTML = '<bdi>' + overview + '</bdi>';
                overviewElement.classList.remove('hide');
                overviewElement.classList.add('detail-clamp-text');

                const expandButton = overviewElement.parentElement.querySelector('.overview-expand');

                if (overviewElement.scrollHeight - overviewElement.offsetHeight > 2) {
                    expandButton.classList.remove('hide');
                } else {
                    expandButton.classList.add('hide');
                }

                expandButton.addEventListener('click', toggleLineClamp.bind(null, overviewElement));

                for (const anchor of overviewElement.querySelectorAll('a')) {
                    anchor.setAttribute('target', '_blank');
                }
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
