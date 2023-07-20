import './appFooter.scss';

function render() {
    const elem = document.createElement('div');
    elem.classList.add('appfooter');

    document.body.appendChild(elem);

    return elem;
}

class AppFooter {
    constructor() {
        this.element = render();

        this.add = function (elem) {
            this.element.appendChild(elem);
        };

        this.insert = function (elem) {
            if (typeof elem === 'string') {
                this.element.insertAdjacentHTML('afterbegin', elem);
            } else {
                this.element.insertBefore(elem, this.element.firstChild);
            }
        };
    }

    destroy() {
        this.element = null;
    }
}

export default new AppFooter();
