const ProgressBarPrototype = Object.create(HTMLDivElement.prototype);

function onAutoTimeProgress() {
    const start = parseInt(this.getAttribute('data-starttime'), 10);
    const end = parseInt(this.getAttribute('data-endtime'), 10);

    const now = new Date().getTime();
    const total = end - start;
    let pct = 100 * ((now - start) / total);

    pct = Math.min(100, pct);
    pct = Math.max(0, pct);

    const itemProgressBarForeground = this.querySelector('.itemProgressBarForeground');
    itemProgressBarForeground.style.width = pct + '%';
}

ProgressBarPrototype.attachedCallback = function () {
    if (this.timeInterval) {
        clearInterval(this.timeInterval);
    }

    if (this.getAttribute('data-automode') === 'time') {
        this.timeInterval = setInterval(onAutoTimeProgress.bind(this), 60000);
    }
};

ProgressBarPrototype.detachedCallback = function () {
    if (this.timeInterval) {
        clearInterval(this.timeInterval);
        this.timeInterval = null;
    }
};

document.registerElement('emby-progressbar', {
    prototype: ProgressBarPrototype,
    extends: 'div'
});
