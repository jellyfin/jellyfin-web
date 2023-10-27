import type { Jellyfin } from '@jellyfin/sdk';

import browser from 'scripts/browser';

import pkg from '../../package.json';

interface CrashContext {
    initialTime: number
}

interface CrashDetails {
    event: Event | string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
}

const buildDetailsTemplate = (
    message: string,
    details: CrashDetails
) => {
    const templates: string[] = [];
    if (details.error?.name) templates.push(`***Name***: \`${details.error.name}\``);
    templates.push(`***Message***: \`${message}\``);
    if (details.source) templates.push(`***Source***: \`${details.source}\``);
    if (details.lineno) templates.push(`***Line number***: \`${details.lineno}\``);
    if (details.colno) templates.push(`***Column number***: \`${details.colno}\``);

    return templates.join('\n');
};

export const buildLogTemplate = (
    jellyfin: Jellyfin,
    context: CrashContext,
    details: CrashDetails
) => {
    const event = details.event as Event;
    const message = (details.event as string) ?? details.error?.message;
    const startTime = new Date(context.initialTime);
    const crashTime = event?.timeStamp ? new Date(context.initialTime + event.timeStamp) : new Date();

    return `---
client: ${pkg.name}
client_version: ${pkg.version}
client_repository: ${pkg.repository}
type: crash_report
format: markdown
---

### Logs

${buildDetailsTemplate(message, details)}
***Stack Trace***:
\`\`\`log
${details.error?.stack}
\`\`\`

### App information

***App name***: \`${jellyfin.clientInfo.name}\`
***App version***: \`${jellyfin.clientInfo.version}\`
***Package name***: \`${pkg.name}\`
***Package config***:
\`\`\`json
${JSON.stringify(pkg)}
\`\`\`
***Build options****:
| Option               | Value                   |
|----------------------|-------------------------|
| __USE_SYSTEM_FONTS__ | ${__USE_SYSTEM_FONTS__} |
| __WEBPACK_SERVE__    | ${__WEBPACK_SERVE__}    |

### Device information

***Device name***: \`${jellyfin.deviceInfo.name}\`
***Browser information***:
\`\`\`json
${JSON.stringify(browser)}
\`\`\`

### Crash information

***Start time***: \`${startTime.toISOString()}\`
***Crash time***: \`${crashTime.toISOString()}\`
`;
};
