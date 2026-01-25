/**
 * @deprecated This component uses legacy patterns (FunctionComponent, navigate from utils/dashboard).
 *
 * Migration:
 * - Convert to typed FC with proper React.ReactNode
 * - Use React Router useNavigate() instead of utils/dashboard
 * - Replace LinkButton with ui-primitives/Button
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import React, { FunctionComponent } from 'react';

import globalize from 'lib/globalize';
import { navigate } from '../../../utils/dashboard';
import LinkButton from '../../../elements/emby-button/LinkButton';
import { logger } from '../../../utils/logger';

type IProps = {
    activeTab: string;
};

function useNavigate(url: string): () => void {
    return React.useCallback(() => {
        navigate(url, true).catch(err => {
            logger.warn('Error navigating to dashboard url', { component: 'SectionTabs' }, err as Error);
        });
    }, [url]);
}

const SectionTabs: FunctionComponent<IProps> = ({ activeTab }: IProps) => {
    const onClickProfile = useNavigate('/dashboard/users/profile');
    const onClickAccess = useNavigate('/dashboard/users/access');
    const onClickParentalControl = useNavigate('/dashboard/users/parentalcontrol');
    const clickPassword = useNavigate('/dashboard/users/password');
    return (
        <div data-role="controlgroup" data-type="horizontal" className="localnav">
            <LinkButton
                href="#"
                data-role="button"
                className={activeTab === 'useredit' ? 'ui-btn-active' : ''}
                onClick={onClickProfile}
            >
                {globalize.translate('Profile')}
            </LinkButton>
            <LinkButton
                href="#"
                data-role="button"
                className={activeTab === 'userlibraryaccess' ? 'ui-btn-active' : ''}
                onClick={onClickAccess}
            >
                {globalize.translate('TabAccess')}
            </LinkButton>
            <LinkButton
                href="#"
                data-role="button"
                className={activeTab === 'userparentalcontrol' ? 'ui-btn-active' : ''}
                onClick={onClickParentalControl}
            >
                {globalize.translate('TabParentalControl')}
            </LinkButton>
            <LinkButton
                href="#"
                data-role="button"
                className={activeTab === 'userpassword' ? 'ui-btn-active' : ''}
                onClick={clickPassword}
            >
                {globalize.translate('HeaderPassword')}
            </LinkButton>
        </div>
    );
};

export default SectionTabs;
