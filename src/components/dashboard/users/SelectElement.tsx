import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createSelectElement = ({ className, label, option }) => ({
    __html: `<select
        class="${className}"
        is="emby-select"
        label="${label}"
        >
        ${option}
    </select>`
});

type IProps = {
    className?: string;
    label?: string;
    currentProviderId: string;
    providers: any
}

const SelectElement: FunctionComponent<IProps> = ({ className, label, currentProviderId, providers }: IProps) => {
    const renderOption = providers.map((provider) => {
        const selected = provider.Id === currentProviderId || providers.length < 2 ? ' selected' : '';
        return '<option value="' + provider.Id + '"' + selected + '>' + provider.Name + '</option>';
    });

    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                className: className,
                label: globalize.translate(label),
                option: renderOption
            })}
        />
    );
};

export default SelectElement;
