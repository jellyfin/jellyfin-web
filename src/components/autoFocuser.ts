import focusManager from './focusManager';
import layoutManager from './layoutManager';

let activeElement: HTMLElement | null = null;

export function isEnabled(): boolean {
    return layoutManager.tv;
}

export function enable(): void {
    if (!isEnabled()) return;
    window.addEventListener('focusin', (e: FocusEvent) => {
        activeElement = e.target as HTMLElement;
    });
    console.debug('AutoFocuser enabled');
}

export function autoFocus(container?: HTMLElement | null): HTMLElement | null {
    if (!isEnabled()) return null;
    const resolvedContainer = container || document.body;
    let candidates: (HTMLElement | null)[] = [];

    if (activeElement) {
        if (activeElement.classList.contains('btnPreviousPage')) {
            candidates.push(resolvedContainer.querySelector('.btnPreviousPage'));
            candidates.push(resolvedContainer.querySelector('.btnNextPage'));
        } else if (activeElement.classList.contains('btnNextPage')) {
            candidates.push(resolvedContainer.querySelector('.btnNextPage'));
            candidates.push(resolvedContainer.querySelector('.btnPreviousPage'));
        } else if (activeElement.classList.contains('btnSelectView')) {
            candidates.push(resolvedContainer.querySelector('.btnSelectView'));
        }
        candidates.push(activeElement);
    }

    candidates = candidates.concat(Array.from(resolvedContainer.querySelectorAll('.btnPlay')) as HTMLElement[]);

    let focusedElement: HTMLElement | null = null;
    for (const element of candidates) {
        if (element && focusManager.isCurrentlyFocusable(element)) {
            focusManager.focus(element);
            focusedElement = element;
            break;
        }
    }

    if (!focusedElement) {
        const itemsContainer = resolvedContainer.querySelector('.itemsContainer') as HTMLElement | null;
        if (itemsContainer) focusedElement = focusManager.autoFocus(itemsContainer);
    }

    if (!focusedElement) focusedElement = focusManager.autoFocus(resolvedContainer);
    return focusedElement;
}

const autoFocuser = { isEnabled, enable, autoFocus };
export default autoFocuser;
