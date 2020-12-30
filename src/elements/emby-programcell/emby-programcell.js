class ProgramCell extends HTMLButtonElement {
    disconnectedCallback() {
        this.posLeft = null;
        this.posWidth = null;
        this.guideProgramName = null;
    }
}

customElements.define('emby-programcell', ProgramCell, {
    extends: 'button'
});
