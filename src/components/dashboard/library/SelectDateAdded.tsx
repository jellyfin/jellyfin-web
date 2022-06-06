import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createSelectElement = ({ className, id, label }: { className?: string, id?: string, label: string }) => ({
    __html: `<select
        class="${className}"
        is="emby-select"
        id="${id}"
        label="${label}"
        >
        <option value='0'>${globalize.translate('OptionDateAddedImportTime')}</option>
        <option value='1'>${globalize.translate('OptionDateAddedFileTime')}</option>
    </select>`
});

type IProps = {
    className?: string;
    id?: string;
    label?: string
}

const SelectDateAdded: FunctionComponent<IProps> = ({ className, id, label }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                className: className,
                id: id,
                label: globalize.translate(label)
            })}
        />
    );
};

export default SelectDateAdded;
