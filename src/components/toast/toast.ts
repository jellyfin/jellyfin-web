import './toast.scss';

interface Toast {
    text: string
}

let toastContainer: HTMLDivElement;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.classList.add('toastContainer');
        document.body.appendChild(toastContainer);
    }

    return toastContainer;
}

function remove(elem: HTMLElement) {
    setTimeout(function () {
        elem.parentNode?.removeChild(elem);
    }, 300);
}

function animateRemove(elem: HTMLElement) {
    setTimeout(function () {
        elem.classList.add('toastHide');
        remove(elem);
    }, 3300);
}

export default function (options: string | Toast) {
    if (typeof options === 'string') {
        options = {
            text: options
        } as Toast;
    }

    const elem = document.createElement('div');
    elem.classList.add('toast');
    elem.textContent = options.text;

    getToastContainer().appendChild(elem);

    setTimeout(function () {
        elem.classList.add('toastVisible');

        animateRemove(elem);
    }, 300);
}
