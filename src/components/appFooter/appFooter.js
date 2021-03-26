import './appFooter.scss';

function render(options) {
    const elem = document.createElement('div');
    elem.classList.add('appfooter');

    document.body.appendChild(elem);

    return elem;
}

class appFooter {
    constructor(options) {
        const self = this;

        self.element = render(options);
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

export default new appFooter({});
