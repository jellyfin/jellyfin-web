import { flushSync } from 'react-dom';

export async function flushEffects() {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
}

export async function waitUntil(assertion: () => void) {
    let lastError: unknown;

    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            assertion();
            return;
        } catch (error) {
            lastError = error;
            await flushEffects();
        }
    }

    throw lastError;
}

export async function dispatchFormSubmit(container: ParentNode, selector: string) {
    const form = container.querySelector(selector);

    if (!(form instanceof HTMLFormElement)) {
        throw new TypeError(`Expected form ${selector} to be rendered`);
    }

    flushSync(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await flushEffects();
}

export async function changeCheckbox(container: ParentNode, selector: string, checked: boolean) {
    const checkbox = container.querySelector(selector);

    if (!(checkbox instanceof HTMLInputElement)) {
        throw new TypeError(`Expected checkbox ${selector} to exist`);
    }

    checkbox.checked = checked;
    flushSync(() => {
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await flushEffects();
    return checkbox;
}

export async function clickButton(container: ParentNode, selector: string) {
    const button = container.querySelector(selector);

    if (!(button instanceof HTMLButtonElement)) {
        throw new TypeError(`Expected button ${selector} to exist`);
    }

    flushSync(() => {
        button.click();
    });

    await flushEffects();
}

export async function dismissToast(onClose?: (event: Event, reason: string) => void) {
    flushSync(() => {
        onClose?.(new Event('close'), 'clickaway');
    });

    await flushEffects();
}

export function cloneJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}
