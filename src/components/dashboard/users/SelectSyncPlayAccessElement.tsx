import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createSelectElement = ({ className, id, label }: { className?: string, id?: string, label: string }) => ({
    __html: `<select
        class="${className}"
        is="emby-select"
        id="${id}"
        label="${label}"
        >
        <option value='CreateAndJoinGroups'>${globalize.translate('LabelSyncPlayAccessCreateAndJoinGroups')}</option>
        <option value='JoinGroups'>${globalize.translate('LabelSyncPlayAccessJoinGroups')}</option>
        <option value='None'>${globalize.translate('LabelSyncPlayAccessNone')}</option>
    </select>`
});

type IProps = {
    className?: string;
    id?: string;
    label?: string
}

const SelectSyncPlayAccessElement: FunctionComponent<IProps> = ({ className, id, label }: IProps) => {
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

export default SelectSyncPlayAccessElement;
