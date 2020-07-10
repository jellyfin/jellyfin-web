const ProgramCellPrototype = Object.create(HTMLButtonElement.prototype);

ProgramCellPrototype.detachedCallback = function () {
    this.posLeft = null;
    this.posWidth = null;
    this.guideProgramName = null;
};

document.registerElement('emby-programcell', {
    prototype: ProgramCellPrototype,
    extends: 'button'
});
