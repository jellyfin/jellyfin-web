import { CompanyKind } from '@jellyfin/sdk/lib/generated-client/models/company-kind';

import createCompaniesController from './tvcompanies';

export default createCompaniesController(CompanyKind.Network);
