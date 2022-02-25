import browser from './browser';

/**
 * Copies text to the clipboard using the textarea.
 * @param {string} text - Text to copy.
 * @returns {Promise<void>} Promise.
 */
function textAreaCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();

    // iOS 13.4 supports Clipboard.writeText (https://stackoverflow.com/a/61868028)
    if (browser.iOS && browser.iOSVersion < 13.4) {
        // https://stackoverflow.com/a/46858939

        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
    } else {
        textArea.select();
    }

    let ret;

    try {
        if (document.execCommand('copy')) {
            ret = Promise.resolve();
        } else {
            ret = Promise.reject();
        }
    } catch (_) {
        ret = Promise.reject();
    }

    document.body.removeChild(textArea);

    return ret;
}

/**
 * Copies text to the clipboard.
 * @param {string} text - Text to copy.
 * @returns {Promise<void>} Promise.
 */
export function copy(text) {
    /* eslint-disable-next-line compat/compat */
    if (navigator.clipboard === undefined) {
        return textAreaCopy(text);
    } else {
        /* eslint-disable-next-line compat/compat */
        return navigator.clipboard.writeText(text).catch(() => {
            return textAreaCopy(text);
        });
    }
}
