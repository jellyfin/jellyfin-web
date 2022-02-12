import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createSelectElement = ({ className, label, option }) => ({
    __html: `<select
        class="${className}"
        is="emby-select"
        label="${label}"
    >
        <option value=''></option>
        ${option}
    </select>`
});

type RatingsArr = {
    Name: string;
    Value: number;
}

type IProps = {
    className?: string;
    label?: string;
    parentalRatings: RatingsArr[];
}

const SelectMaxParentalRating: FunctionComponent<IProps> = ({ className, label, parentalRatings }: IProps) => {
    const renderOption = () => {
        let content = '';
        for (const rating of parentalRatings) {
            content += `<option value='${rating.Value}'>${rating.Name}</option>`;
        }
        return content;
    };

    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                className: className,
                label: globalize.translate(label),
                option: renderOption()
            })}
        />
    );
};

export default SelectMaxParentalRating;
