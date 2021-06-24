import './jellyfin-collapse.scss';
import 'webcomponents.js/webcomponents-lite';
import '../jellyfin-button/jellyfin-button';

/* eslint-disable indent */

    const JellyfinButtonPrototype = Object.create(HTMLDivElement.prototype);

    function slideDownToShow(button, elem) {
        requestAnimationFrame(() => {
            elem.classList.remove('hide');
            elem.classList.add('expanded');
            elem.style.height = 'auto';
            const height = elem.offsetHeight + 'px';
            elem.style.height = '0';
            // trigger reflow
            // TODO: Find a better way to do this
            const newHeight = elem.offsetHeight; /* eslint-disable-line no-unused-vars */
            elem.style.height = height;

            setTimeout(function () {
                if (elem.classList.contains('expanded')) {
                    elem.classList.remove('hide');
                } else {
                    elem.classList.add('hide');
                }
                elem.style.height = 'auto';
            }, 300);

            const icon = button.querySelector('.material-icons');
            icon.classList.add('jellyfin-collapse-expandIconExpanded');
        });
    }

    function slideUpToHide(button, elem) {
        requestAnimationFrame(() => {
            elem.style.height = elem.offsetHeight + 'px';
            // trigger reflow
            // TODO: Find a better way to do this
            const newHeight = elem.offsetHeight; /* eslint-disable-line no-unused-vars */
            elem.classList.remove('expanded');
            elem.style.height = '0';

            setTimeout(function () {
                if (elem.classList.contains('expanded')) {
                    elem.classList.remove('hide');
                } else {
                    elem.classList.add('hide');
                }
            }, 300);

            const icon = button.querySelector('.material-icons');
            icon.classList.remove('jellyfin-collapse-expandIconExpanded');
        });
    }

    function onButtonClick() {
        const button = this;
        const collapseContent = button.parentNode.querySelector('.collapseContent');

        if (collapseContent.expanded) {
            collapseContent.expanded = false;
            slideUpToHide(button, collapseContent);
        } else {
            collapseContent.expanded = true;
            slideDownToShow(button, collapseContent);
        }
    }

    JellyfinButtonPrototype.attachedCallback = function () {
        if (this.classList.contains('jellyfin-collapse')) {
            return;
        }

        this.classList.add('jellyfin-collapse');

        const collapseContent = this.querySelector('.collapseContent');
        if (collapseContent) {
            collapseContent.classList.add('hide');
        }

        const title = this.getAttribute('title');

        const html = '<button is="jellyfin-button" type="button" on-click="toggleExpand" id="expandButton" class="jellyfin-collapsible-button iconRight"><h3 class="jellyfin-collapsible-title" title="' + title + '">' + title + '</h3><span class="material-icons jellyfin-collapse-expandIcon expand_more"></span></button>';

        this.insertAdjacentHTML('afterbegin', html);

        const button = this.querySelector('.jellyfin-collapsible-button');

        button.addEventListener('click', onButtonClick);

        if (this.getAttribute('data-expanded') === 'true') {
            onButtonClick.call(button);
        }
    };

    document.registerElement('jellyfin-collapse', {
        prototype: JellyfinButtonPrototype,
        extends: 'div'
    });

/* eslint-enable indent */
