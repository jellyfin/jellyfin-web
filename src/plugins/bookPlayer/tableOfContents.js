import escapeHTML from 'escape-html';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import layoutManager from 'components/layoutManager';

export default class TableOfContents {
    constructor(bookPlayer) {
        this.bookPlayer = bookPlayer;
        this.rendition = bookPlayer.rendition;

        this.onDialogClosed = this.onDialogClosed.bind(this);

        this.createMediaElement();
    }

    destroy() {
        const elem = this.elem;
        if (elem) {
            this.unbindEvents();
            dialogHelper.close(elem);
        }

        this.bookPlayer.tocElement = null;
    }

    bindEvents() {
        const elem = this.elem;

        elem.addEventListener('close', this.onDialogClosed, { once: true });
        elem.querySelector('.btnBookplayerTocClose').addEventListener('click', this.onDialogClosed, { once: true });
    }

    unbindEvents() {
        const elem = this.elem;

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

    chapterTocItem(book, chapter) {
        let itemHtml = '<li>';

        // remove parent directory reference from href to fix certain books
        const link = chapter.href.startsWith('../') ? chapter.href.slice(3) : chapter.href;
        itemHtml += `<a style="color: ${layoutManager.mobile ? this.bookPlayer.THEMES[this.bookPlayer.theme].body.color : 'inherit'}" href="${escapeHTML(book.path.directory + link)}">${escapeHTML(chapter.label)}</a>`;

        if (chapter.subitems?.length) {
            const subHtml = chapter.subitems
                .map((nestedChapter) => this.chapterTocItem(book, nestedChapter))
                .join('');

            itemHtml += `<ul>${subHtml}</ul>`;
        }

        itemHtml += '</li>';
        return itemHtml;
    }

    createMediaElement() {
        const rendition = this.rendition;

        const elem = dialogHelper.createDialog({
            size: 'small',
            autoFocus: false,
            removeOnClose: true
        });

        elem.id = 'dialogToc';

        let tocHtml = '<div class="topRightActionButtons">';
        tocHtml += '<button is="paper-icon-button-light" class="autoSize bookplayerButton btnBookplayerTocClose hide-mouse-idle-tv" tabindex="-1"><span class="material-icons bookplayerButtonIcon close" aria-hidden="true"></span></button>';
        tocHtml += '</div>';
        tocHtml += `<ul style="background-color: ${layoutManager.mobile ? this.bookPlayer.THEMES[this.bookPlayer.theme].body.background : 'inherit'}" class="toc">`;
        rendition.book.navigation.forEach((chapter) => {
            tocHtml += this.chapterTocItem(rendition.book, chapter);
        });

        tocHtml += '</ul>';
        elem.innerHTML = tocHtml;

        this.replaceLinks(elem, (href) => {
            const relative = rendition.book.path.relative(href);
            rendition.display(relative);
            this.destroy();
        });

        this.elem = elem;

        this.bindEvents();
        dialogHelper.open(elem);
    }
}
