/**
 * Subtitle settings visual helper.
 * @module components/subtitleSettings/subtitleAppearanceHelper
 */

function getTextStyles(settings, preview) {
    const list = [];

    switch (settings.textSize || '') {
        case 'smaller':
            list.push({ name: 'font-size', value: '.8em' });
            break;
        case 'small':
            list.push({ name: 'font-size', value: 'inherit' });
            break;
        case 'larger':
            list.push({ name: 'font-size', value: '2em' });
            break;
        case 'extralarge':
            list.push({ name: 'font-size', value: '2.2em' });
            break;
        case 'large':
            list.push({ name: 'font-size', value: '1.72em' });
            break;
        case 'medium':
        default:
            list.push({ name: 'font-size', value: '1.36em' });
            break;
    }

    switch (settings.textWeight || '') {
        case 'bold':
            list.push({ name: 'font-weight', value: 'bold' });
            break;
        case 'normal':
        default:
            list.push({ name: 'font-weight', value: 'normal' });
            break;
    }

    switch (settings.dropShadow || '') {
        case 'raised':
            list.push({ name: 'text-shadow', value: '-0.04em -0.04em #fff, 0px -0.04em #fff, -0.04em 0px #fff, 0.04em 0.04em #000, 0px 0.04em #000, 0.04em 0px #000' });
            break;
        case 'depressed':
            list.push({ name: 'text-shadow', value: '0.04em 0.04em #fff, 0px 0.04em #fff, 0.04em 0px #fff, -0.04em -0.04em #000, 0px -0.04em #000, -0.04em 0px #000' });
            break;
        case 'uniform':
            list.push({ name: 'text-shadow', value: '#000 0px 0.03em, #000 0px -0.03em, #000 0px 0.05em, #000 0px -0.05em, #000 0.03em 0px, #000 -0.03em 0px, #000 0.03em 0.03em, #000 -0.03em 0.03em, #000 0.03em -0.03em, #000 -0.03em -0.03em, #000 0.03em 0.05em, #000 -0.03em 0.05em, #000 0.03em -0.05em, #000 -0.03em -0.05em, #000 0.05em 0px, #000 -0.05em 0px, #000 0.05em 0.03em, #000 -0.05em 0.03em, #000 0.05em -0.03em, #000 -0.05em -0.03em' });
            break;
        case 'none':
            list.push({ name: 'text-shadow', value: 'none' });
            break;
        case 'dropshadow':
        default:
            list.push({ name: 'text-shadow', value: '#000000 0px 0px 7px' });
            break;
    }

    const background = settings.textBackground || 'transparent';
    if (background) {
        list.push({ name: 'background-color', value: background });
    }

    const textColor = settings.textColor || '#ffffff';
    if (textColor) {
        list.push({ name: 'color', value: textColor });
    }

    switch (settings.font || '') {
        case 'typewriter':
            list.push({ name: 'font-family', value: '"Courier New",monospace' });
            list.push({ name: 'font-variant', value: 'none' });
            break;
        case 'print':
            list.push({ name: 'font-family', value: 'Georgia,Times New Roman,Arial,Helvetica,serif' });
            list.push({ name: 'font-variant', value: 'none' });
            break;
        case 'console':
            list.push({ name: 'font-family', value: 'Consolas,Lucida Console,Menlo,Monaco,monospace' });
            list.push({ name: 'font-variant', value: 'none' });
            break;
        case 'cursive':
            list.push({ name: 'font-family', value: 'Lucida Handwriting,Brush Script MT,Segoe Script,cursive,Quintessential,system-ui,-apple-system,BlinkMacSystemFont,sans-serif' });
            list.push({ name: 'font-variant', value: 'none' });
            break;
        case 'casual':
            list.push({ name: 'font-family', value: 'Gabriola,Segoe Print,Comic Sans MS,Chalkboard,Short Stack,system-ui,-apple-system,BlinkMacSystemFont,sans-serif' });
            list.push({ name: 'font-variant', value: 'none' });
            break;
        case 'smallcaps':
            list.push({ name: 'font-family', value: 'Copperplate Gothic,Copperplate Gothic Bold,Copperplate,system-ui,-apple-system,BlinkMacSystemFont,sans-serif' });
            list.push({ name: 'font-variant', value: 'small-caps' });
            break;
        default:
            list.push({ name: 'font-family', value: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol' });
            list.push({ name: 'font-variant', value: 'none' });
            break;
    }

    if (!preview) {
        const pos = parseInt(settings.verticalPosition, 10);
        const lineHeight = 1.35; // FIXME: It is better to read this value from element
        if (pos < 0) {
            const margin = Math.abs(pos + 1) * lineHeight;
            list.push({ name: 'margin-bottom', value: `${margin}em` });
            list.push({ name: 'margin-top', value: '' });
        } else {
            const margin = pos * lineHeight;
            list.push({ name: 'margin-bottom', value: '' });
            list.push({ name: 'margin-top', value: `${margin}em` });
        }
    }

    return list;
}

function getWindowStyles(settings, preview) {
    const list = [];

    if (!preview) {
        const pos = parseInt(settings.verticalPosition, 10);
        if (pos < 0) {
            list.push({ name: 'top', value: '' });
            list.push({ name: 'bottom', value: '0' });
        } else {
            list.push({ name: 'top', value: '0' });
            list.push({ name: 'bottom', value: '' });
        }
    }

    return list;
}

export function getStyles(settings, preview) {
    return {
        text: getTextStyles(settings, preview),
        window: getWindowStyles(settings, preview)
    };
}

function applyStyleList(styles, elem) {
    for (let i = 0, length = styles.length; i < length; i++) {
        const style = styles[i];

        elem.style[style.name] = style.value;
    }
}

export function applyStyles(elements, appearanceSettings) {
    const styles = getStyles(appearanceSettings, !!elements.preview);

    if (elements.text) {
        applyStyleList(styles.text, elements.text);
    }
    if (elements.window) {
        applyStyleList(styles.window, elements.window);
    }
}
export default {
    getStyles: getStyles,
    applyStyles: applyStyles
};
