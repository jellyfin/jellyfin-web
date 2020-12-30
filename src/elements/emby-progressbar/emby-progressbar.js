
function onAutoTimeProgress() {
    const start = parseInt(this.getAttribute('data-starttime'));
    const end = parseInt(this.getAttribute('data-endtime'));

    const now = new Date().getTime();
    const total = end - start;
    let pct = 100 * ((now - start) / total);

    pct = Math.min(100, pct);
    pct = Math.max(0, pct);

    const itemProgressBarForeground = this.querySelector('.itemProgressBarForeground');
    itemProgressBarForeground.style.width = pct + '%';
}
class ProgressBar extends HTMLDivElement {
    connectedCallback() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }

        if (this.getAttribute('data-automode') === 'time') {
            this.timeInterval = setInterval(onAutoTimeProgress.bind(this), 60000);
        }
    }

    disconnectedCallback() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }
}

customElements.define('emby-progressbar', ProgressBar, {
    extends: 'div'
});
