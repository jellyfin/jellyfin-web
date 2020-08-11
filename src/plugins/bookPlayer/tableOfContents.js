import dialogHelper from 'dialogHelper';

export default class TableOfContents {
    constructor(bookPlayer) {
        this._bookPlayer = bookPlayer;
        this._rendition = bookPlayer._rendition;

        this.onDialogClosed = this.onDialogClosed.bind(this);

        this.createMediaElement();
    }

    destroy() {
        const elem = this._elem;
        if (elem) {
            this.unbindEvents();
            dialogHelper.close(elem);
        }

        this._bookPlayer._tocElement = null;
    }

    bindEvents() {
        const elem = this._elem;

        elem.addEventListener('close', this.onDialogClosed, {once: true});
        elem.querySelector('.btnBookplayerTocClose').addEventListener('click', this.onDialogClosed, {once: true});
    }

    unbindEvents() {
        const elem = this._elem;

        elem.removeEventListener('close', this.onDialogClosed);
        elem.querySelector('.btnBookplayerTocClose').removeEventListener('click', this.onDialogClosed);
    }

    onDialogClosed() {
        this.destroy();
    }

    replaceLinks(contents, f) {
        const links = contents.querySelectorAll('a[href]');

        links.forEach((link) => {
            const href = link.getAttribute('href');

            link.onclick = () => {
                f(href);
                return false;
            };
        });
    }

    createMediaElement() {
        const rendition = this._rendition;

        const elem = dialogHelper.createDialog({
            size: 'small',
            autoFocus: false,
            removeOnClose: true
        });

        elem.id = 'dialogToc';

        let tocHtml = '<div class="topRightActionButtons">';
        tocHtml += '<button is="paper-icon-button-light" class="autoSize bookplayerButton btnBookplayerTocClose hide-mouse-idle-tv" tabindex="-1"><span class="material-icons bookplayerButtonIcon close"></span></button>';
        tocHtml += '</div>';
        tocHtml += '<ul class="toc">';
        rendition.book.navigation.forEach((chapter) => {
            tocHtml += '<li>';
            // Remove '../' from href
            const link = chapter.href.startsWith('../') ? chapter.href.substr(3) : chapter.href;
            tocHtml += `<a href="${rendition.book.path.directory + link}">${chapter.label}</a>`;
            tocHtml += '</li>';
        });

        tocHtml += '</ul>';
        elem.innerHTML = tocHtml;

        this.replaceLinks(elem, (href) => {
            const relative = rendition.book.path.relative(href);
            rendition.display(relative);
            this.destroy();
        });

        this._elem = elem;

        this.bindEvents();
        dialogHelper.open(elem);
    }
}
