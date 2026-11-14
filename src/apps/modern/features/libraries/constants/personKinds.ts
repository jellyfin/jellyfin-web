import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';

/** person roles that are relevant to movies or TV shows */
const VIDEO_PERSON_KINDS = [
    PersonKind.Actor,
    PersonKind.Director,
    PersonKind.Writer,
    PersonKind.Producer,
    PersonKind.GuestStar,
    PersonKind.Unknown
];

const BOOK_PERSON_KINDS = [
    PersonKind.Author,
    PersonKind.Illustrator,
    PersonKind.Penciller,
    PersonKind.Inker,
    PersonKind.Colorist,
    PersonKind.Letterer,
    PersonKind.CoverArtist,
    PersonKind.Editor,
    PersonKind.Translator,
    PersonKind.Narrator,
    PersonKind.Unknown
];

const MUSIC_PERSON_KINDS = [
    PersonKind.Artist,
    PersonKind.AlbumArtist,
    PersonKind.Composer,
    PersonKind.Conductor,
    PersonKind.Lyricist,
    PersonKind.Arranger,
    PersonKind.Producer,
    PersonKind.Engineer,
    PersonKind.Mixer,
    PersonKind.Remixer,
    PersonKind.Unknown
];

export const getPersonKinds = (itemType: BaseItemKind[]) => {
    if (itemType.every((kind) => kind === BaseItemKind.AudioBook || kind === BaseItemKind.Book)) {
        return BOOK_PERSON_KINDS;
    }

    if (itemType.every((kind) => kind === BaseItemKind.Audio || kind === BaseItemKind.MusicAlbum)) {
        return MUSIC_PERSON_KINDS;
    }

    if (itemType.every((kind) => kind === BaseItemKind.Movie || kind === BaseItemKind.Series)) {
        return VIDEO_PERSON_KINDS;
    }

    return Object.values(PersonKind);
};
