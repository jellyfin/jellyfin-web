export interface LazyLoaderOptions {
    callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void;
}

export class LazyLoader {
    private options: LazyLoaderOptions | null;
    private observer: IntersectionObserver | null = null;

    constructor(options: LazyLoaderOptions) {
        this.options = options;
    }

    private createObserver(): void {
        if (!this.options) return;
        const callback = this.options.callback;

        this.observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => callback(entry, observer));
            },
            {
                rootMargin: '50%',
                threshold: 0
            }
        );
    }

    addElements(elements: HTMLCollectionOf<Element> | Element[]): void {
        if (!this.observer) this.createObserver();
        if (this.observer) {
            Array.from(elements).forEach((element) => this.observer!.observe(element));
        }
    }

    destroyObserver(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    destroy(): void {
        this.destroyObserver();
        this.options = null;
    }
}

function unveilElements(
    elements: HTMLCollectionOf<Element>,
    _root: Element,
    callback: LazyLoaderOptions['callback']
): void {
    if (!elements.length) return;
    const lazyLoader = new LazyLoader({ callback });
    lazyLoader.addElements(elements);
}

export function lazyChildren(elem: Element, callback: LazyLoaderOptions['callback']): void {
    unveilElements(elem.getElementsByClassName('lazy'), elem, callback);
}

const lazyLoader = { LazyLoader, lazyChildren };
export default lazyLoader;
