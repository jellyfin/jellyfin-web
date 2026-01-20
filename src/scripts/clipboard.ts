import browser from './browser';

/**
 * Copies text to the clipboard using the textarea.
 */
function textAreaCopy(text: string): Promise<void> {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();

    // iOS 13.4 supports Clipboard.writeText (https://stackoverflow.com/a/61868028)
    if (browser.iOS && (browser as any).iOSVersion < 13.4) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        textArea.setSelectionRange(0, 999999);
    } else {
        textArea.select();
    }

    let ret: Promise<void>;
    try {
        if (document.execCommand('copy')) {
            ret = Promise.resolve();
        } else {
            ret = Promise.reject();
        }
    } catch {
        ret = Promise.reject();
    }

    document.body.removeChild(textArea);
    return ret;
}

/**
 * Copies text to the clipboard.
 */
export function copy(text: string): Promise<void> {
    if (navigator.clipboard === undefined) {
        return textAreaCopy(text);
    } else {
        return navigator.clipboard.writeText(text).catch(() => {
            return textAreaCopy(text);
        });
    }
}

const clipboard = { copy };
export default clipboard;
