import globalize from 'lib/globalize';

export function setSortButtonIcon(btnSortIcon, icon) {
    btnSortIcon.classList.remove('arrow_downward');
    btnSortIcon.classList.remove('arrow_upward');
    btnSortIcon.classList.add(icon);
}

export function updateSortText(instance) {
    const btnSortText = instance.btnSortText;

    if (btnSortText) {
        const options = instance.getSortMenuOptions();
        const values = instance.getSortValues();
        const sortBy = values.sortBy;

        for (const option of options) {
            if (sortBy === option.value) {
                btnSortText.innerHTML = globalize.translate('SortByValue', option.name);
                break;
            }
        }

        const btnSortIcon = instance.btnSortIcon;

        if (btnSortIcon) {
            setSortButtonIcon(btnSortIcon, values.sortOrder === 'Descending' ? 'arrow_downward' : 'arrow_upward');
        }
    }
}
