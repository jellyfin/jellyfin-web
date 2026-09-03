import React from 'react';
import UserPasswordForm from 'components/dashboard/users/UserPasswordForm';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';

interface PasswordProps {
    user: UserDto;
}

const Password = ({ user }: PasswordProps) => {
    return (
        <div>
            <div className='readOnlyContent'>
                <UserPasswordForm
                    user={user}
                />
            </div>
        </div>
    );
};

export default Password;
