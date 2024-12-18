import React, { FunctionComponent, useCallback } from 'react';
import type { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client/models/authentication-info';
import ButtonElement from 'elements/ButtonElement';
import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';

type ApiKeyCellProps = {
    apiKey: AuthenticationInfo;
    revokeKey?: (accessToken: string) => void;
};

const ApiKeyCell: FunctionComponent<ApiKeyCellProps> = ({ apiKey, revokeKey }: ApiKeyCellProps) => {
    const getDate = (dateCreated: string | undefined) => {
        const date = datetime.parseISO8601Date(dateCreated, true);
        return datetime.toLocaleDateString(date) + ' ' + datetime.getDisplayTime(date);
    };

    const onClick = useCallback(() => {
        if (apiKey?.AccessToken && revokeKey !== undefined) {
            revokeKey(apiKey.AccessToken);
        }
    }, [apiKey, revokeKey]);

    return (
        <tr className='detailTableBodyRow detailTableBodyRow-shaded apiKey'>
            <td className='detailTableBodyCell'>
                <ButtonElement
                    className='raised raised-mini btnRevoke'
                    title={globalize.translate('ButtonRevoke')}
                    onClick={onClick}
                />
            </td>
            <td className='detailTableBodyCell' style={{ verticalAlign: 'middle' }}>
                {apiKey.AccessToken}
            </td>
            <td className='detailTableBodyCell' style={{ verticalAlign: 'middle' }}>
                {apiKey.AppName}
            </td>
            <td className='detailTableBodyCell' style={{ verticalAlign: 'middle' }}>
                {getDate(apiKey.DateCreated)}
            </td>
        </tr>
    );
};

export default ApiKeyCell;
