import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';

/** person roles that are relevant to movies or TV shows */
export const VIDEO_PERSON_KINDS = [
    PersonKind.Actor,
    PersonKind.Director,
    PersonKind.Writer,
    PersonKind.Producer,
    PersonKind.GuestStar,
    PersonKind.Unknown
];
