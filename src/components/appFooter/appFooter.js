import './appFooter.scss';

function render() {
    const elem = document.createElement('div');
    elem.classList.add('appfooter');

    document.body.appendChild(elem);

    return elem;
}

class appFooter {
    constructor() {
        const self = this;

        self.element = render();
        self.add = function (elem) {
            self.element.appendChild(elem);
        };

        self.insert = function (elem) {
            if (typeof elem === 'string') {
                self.element.insertAdjacentHTML('afterbegin', elem);
            } else {
                self.element.insertBefore(elem, self.element.firstChild);
            }
        };
    }
    destroy() {
        const self = this;

        self.element = null;
    }
}

export default new appFooter();
