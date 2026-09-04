/**
 * Generates a button using the specified icon, classes and properties.
 * @param icon - Name of the material icon on the button
 * @param cssClass - CSS classes to assign to the button
 * @param canFocus - Flag to set the tabindex attribute on the button to -1.
 * @param autoFocusFlag - Flag to set the autofocus attribute on the button.
 * @returns The HTML markup of the button.
 */
export function getIcon(icon: string, cssClass: string, canFocus?: boolean, autoFocusFlag?: boolean) {
    const tabIndex = canFocus ? '' : ' tabindex="-1"';
    const autoFocus = autoFocusFlag ? ' autofocus' : '';
    return '<button is="paper-icon-button-light" class="autoSize ' + cssClass + '"'
    + tabIndex + autoFocus + '><span class="material-icons slideshowButtonIcon '
    + icon + '" aria-hidden="true"></span></button>';
}
