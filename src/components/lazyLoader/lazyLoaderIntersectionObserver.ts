
export class LazyLoader {
    options: { callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void } | null;
    observer: IntersectionObserver | null = null;

    constructor(options: { callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void }) {
        this.options = options;
    }

    createObserver() {
        const callback = this.options!.callback;

        const newObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    callback(entry, observer);
                });
            },
            {
                rootMargin: '50%',
                threshold: 0
            });

        this.observer = newObserver;
    }

    addElements(elements: ArrayLike<Element>) {
        let observer = this.observer;

        if (!observer) {
            this.createObserver();
            observer = this.observer!;
        }

        Array.from(elements).forEach(element => {
            observer.observe(element);
        });
    }

    destroyObserver() {
        const observer = this.observer;

        if (observer) {
            observer.disconnect();
            this.observer = null;
        }
    }

    destroy() {
        this.destroyObserver();
        this.options = null;
    }
}

function unveilElements(
    elements: ArrayLike<Element>,
    root: Element,
    callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void
) {
    if (!elements.length) {
        return;
    }
    const lazyLoader = new LazyLoader({
        callback: callback
    });
    lazyLoader.addElements(elements);
}

export function lazyChildren(
    elem: Element,
    callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void
) {
    unveilElements(elem.getElementsByClassName('lazy'), elem, callback);
}

export default {
    LazyLoader: LazyLoader,
    lazyChildren: lazyChildren
};
