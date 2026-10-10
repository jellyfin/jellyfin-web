import confirm from 'components/confirm/confirm';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { parsePort } from 'apps/wizard/utils/wizardSteps';

export async function validatePort(portStr: string, conflictPortStr?: string) {
    const port = parsePort(portStr);

    if (!Number.isNaN(port) && (port < 1 || port > 65535)) {
        toast(globalize.translate('MessageInvalidPortNumber'));
        return false;
    }

    const conflict = parsePort(conflictPortStr);
    if (!Number.isNaN(port) && port === conflict) {
        toast(globalize.translate('MessagePortConflict'));
        return false;
    }

    if (!Number.isNaN(port) && port < 1024) {
        return confirm({
            title: globalize.translate('HeaderPrivilegedPortWarning'),
            text: globalize.translate('MessagePrivilegedPortWarning'),
            primary: 'delete'
        }).then(() => true).catch(() => false);
    }

    return true;
}
