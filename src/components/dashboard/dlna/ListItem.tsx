import React, { FunctionComponent, useEffect, useRef } from 'react';
import IconButtonElement from '../elements/IconButtonElement';

type ProfileProps = {
    Id?: string,
    Name?: string,
    Type?: string,
}

type IProps = {
    profile: ProfileProps,
    deleteProfile: (id: string | null) => void;
}

const createLinkElement = ({ profile }: { profile: ProfileProps}) => ({
    __html: `<a
        is="emby-linkbutton"
        class="clearLink"
        href="#/dlnaprofile.html?id=${profile.Id}"
        >
        <div>${profile.Name}</div>
    </a>`
});

const ListItem: FunctionComponent<IProps> = ({ profile, deleteProfile }: IProps) => {
    const element = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const btnDeleteProfile = page.querySelectorAll('.btnDeleteProfile');
        for (const elem of btnDeleteProfile) {
            elem.addEventListener('click', function () {
                const id = elem.getAttribute('data-profileid');
                deleteProfile(id);
            });
        }
    }, [deleteProfile]);

    return (
        <div ref={element} className='listItem listItem-border'>
            <span className='listItemIcon material-icons live_tv' aria-hidden='true'></span>
            <div className='listItemBody two-line'
                dangerouslySetInnerHTML={createLinkElement({
                    profile: profile
                })}
            />

            {profile.Type == 'User' && <IconButtonElement
                is='paper-icon-button-light'
                type='button'
                className='btnDeleteProfile'
                title='Delete'
                icon='delete'
                dataProfileid={profile.Id}
            />}
        </div>
    );
};

export default ListItem;
