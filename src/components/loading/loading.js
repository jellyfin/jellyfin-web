import './loading.scss';

let loadingElem;
let layer1;
let layer2;
let layer3;
let layer4;
let circleLefts;
let circleRights;

export function show() {
    let elem = loadingElem;

    if (!elem) {
        elem = document.createElement('div');
        loadingElem = elem;

        elem.classList.add('docspinner');
        elem.classList.add('mdl-spinner');

        elem.innerHTML = '<div class="mdl-spinner__layer mdl-spinner__layer-1"><div class="mdl-spinner__circle-clipper mdl-spinner__left"><div class="mdl-spinner__circle mdl-spinner__circleLeft"></div></div><div class="mdl-spinner__circle-clipper mdl-spinner__right"><div class="mdl-spinner__circle mdl-spinner__circleRight"></div></div></div><div class="mdl-spinner__layer mdl-spinner__layer-2"><div class="mdl-spinner__circle-clipper mdl-spinner__left"><div class="mdl-spinner__circle mdl-spinner__circleLeft"></div></div><div class="mdl-spinner__circle-clipper mdl-spinner__right"><div class="mdl-spinner__circle mdl-spinner__circleRight"></div></div></div><div class="mdl-spinner__layer mdl-spinner__layer-3"><div class="mdl-spinner__circle-clipper mdl-spinner__left"><div class="mdl-spinner__circle mdl-spinner__circleLeft"></div></div><div class="mdl-spinner__circle-clipper mdl-spinner__right"><div class="mdl-spinner__circle mdl-spinner__circleRight"></div></div></div><div class="mdl-spinner__layer mdl-spinner__layer-4"><div class="mdl-spinner__circle-clipper mdl-spinner__left"><div class="mdl-spinner__circle mdl-spinner__circleLeft"></div></div><div class="mdl-spinner__circle-clipper mdl-spinner__right"><div class="mdl-spinner__circle mdl-spinner__circleRight"></div></div></div>';

        document.body.appendChild(elem);

        layer1 = elem.querySelector('.mdl-spinner__layer-1');
        layer2 = elem.querySelector('.mdl-spinner__layer-2');
        layer3 = elem.querySelector('.mdl-spinner__layer-3');
        layer4 = elem.querySelector('.mdl-spinner__layer-4');

        circleLefts = elem.querySelectorAll('.mdl-spinner__circleLeft');
        circleRights = elem.querySelectorAll('.mdl-spinner__circleRight');
    }

    elem.classList.add('mdlSpinnerActive');

    layer1.classList.add('mdl-spinner__layer-1-active');
    layer2.classList.add('mdl-spinner__layer-2-active');
    layer3.classList.add('mdl-spinner__layer-3-active');
    layer4.classList.add('mdl-spinner__layer-4-active');

    for (let i = 0, length = circleLefts.length; i < length; i++) {
        circleLefts[i].classList.add('mdl-spinner__circleLeft-active');
    }

    for (let i = 0, length = circleRights.length; i < length; i++) {
        circleRights[i].classList.add('mdl-spinner__circleRight-active');
    }
}

export function hide() {
    const elem = loadingElem;

    if (elem) {
        elem.classList.remove('mdlSpinnerActive');

        elem.classList.remove('mdl-spinner__layer-1-active');
        elem.classList.remove('mdl-spinner__layer-2-active');
        elem.classList.remove('mdl-spinner__layer-3-active');
        elem.classList.remove('mdl-spinner__layer-4-active');

        for (let i = 0, length = circleLefts.length; i < length; i++) {
            circleLefts[i].classList.remove('mdl-spinner__circleLeft-active');
        }

        for (let i = 0, length = circleRights.length; i < length; i++) {
            circleRights[i].classList.remove('mdl-spinner__circleRight-active');
        }
    }
}

export default {
    show: show,
    hide: hide
};
