import { appHost } from '../../../components/apphost';
import profileBuilder from '../../../scripts/browserDeviceProfile';

export function getDefaultProfile() {
    if (appHost.getDeviceProfile) {
        return appHost.getDeviceProfile(null);
    }

    return profileBuilder({});
}
