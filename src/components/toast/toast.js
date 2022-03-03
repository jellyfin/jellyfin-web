import './toast.scss';

let toastContainer;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.classList.add('toastContainer');
        document.body.appendChild(toastContainer);
    }

    return toastContainer;
}

function remove(elem) {
    setTimeout(function () {
        elem.parentNode.removeChild(elem);
    }, 300);
}

function animateRemove(elem) {
    setTimeout(function () {
        elem.classList.add('toastHide');
        remove(elem);
    }, 3300);
}

export default function (options) {
    if (typeof options === 'string') {
        options = {
            text: options
        };
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
