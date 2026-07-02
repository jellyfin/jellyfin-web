import DOMPurify from 'dompurify';
import markdownIt from 'markdown-it';

// Mirrors DOMPurify's default IS_ALLOWED_URI regex
// (dompurify/dist/purify.js IS_ALLOWED_URI) with the additional
// link-protocol schemes commonly used for admin/community contact info in
// the login disclaimer (jellyfin/jellyfin-web#7958). javascript: and data:
// remain blocked.
//
// The `-` at the start of `[^-a-z+.:]` is literal. Writing `[^a-z+.-:]`
// would expand to a `.`-to-`:` range and strip slashes and digits from
// relative URIs.
// eslint-disable-next-line sonarjs/regex-complexity -- mirrors vendored DOMPurify default
export const LOGIN_DISCLAIMER_ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|matrix|tg|whatsapp|signal|irc|ircs):|[^a-z]|[a-z+.-]+(?:[^-a-z+.:]|$))/i;

export function sanitizeLoginDisclaimer(markdown) {
    return DOMPurify.sanitize(
        // eslint-disable-next-line sonarjs/disabled-auto-escaping
        markdownIt({ html: true }).render(markdown || ''),
        // eslint-disable-next-line @typescript-eslint/naming-convention -- DOMPurify config option
        { ALLOWED_URI_REGEXP: LOGIN_DISCLAIMER_ALLOWED_URI_REGEXP }
    );
}
