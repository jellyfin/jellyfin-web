// FIXME: This file should be moved to the SDK after the 12.0 release.
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { Api } from '@jellyfin/sdk/lib/api';
import { AuthenticationApi } from '@jellyfin/sdk/lib/generated-client/api/authentication-api';

export function getAuthenticationApi(api: Api): AuthenticationApi {
    return new AuthenticationApi(api.configuration, undefined, api.axiosInstance);
}
