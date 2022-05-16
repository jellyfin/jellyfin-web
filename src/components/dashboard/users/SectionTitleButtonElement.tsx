import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

type IProps = {
    id?: string;
    title?: string;
    className?: string;
    icon?: string,
}

const createButtonElement = ({ id, className, title, icon }: { id?: string, className?: string, title?: string, icon?: string }) => ({
    __html: `<button
        is="emby-button"
        type="button"
        id="${id}"
        class="${className}"
        style="margin-left:1em;"
        title="${title}"
    >
        <span class="material-icons ${icon}" aria-hidden="true"></span>
    </button>`
});

const SectionTitleButtonElement: FunctionComponent<IProps> = ({ id, className, title, icon }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                id: id,
                className: className,
                title: globalize.translate(title),
                icon: icon
            })}
        />
    );
};

export default SectionTitleButtonElement;
