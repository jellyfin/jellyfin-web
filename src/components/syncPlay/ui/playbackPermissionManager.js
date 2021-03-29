import { appHost } from '../../apphost';
import dialog from '../../dialog/dialog';
import globalize from '../../../scripts/globalize';

/**
 * Creates an audio element that plays a silent sound.
 * @returns {HTMLMediaElement} The audio element.
 */
function createTestMediaElement() {
    const elem = document.createElement('audio');
    elem.classList.add('testMediaPlayerAudio');
    elem.classList.add('hide');

    document.body.appendChild(elem);

    elem.volume = 1; // Volume should not be zero to trigger proper permissions.
    elem.src = 'assets/audio/silence.mp3'; // Play a silent sound.

    return elem;
}

/**
 * Destroys a media element.
 * @param {HTMLMediaElement} elem The element to destroy.
 */
function destroyTestMediaElement(elem) {
    elem.pause();
    elem.remove();
}

/**
 * Show dialog to the user asking for media control permission.
 * @returns {Promise} Promise that resolves succesfully if user grants permission.
 */
async function showDialog() {
    const options = {
        title: globalize.translate('LabelSyncPlayAlmostReady'),
        text: globalize.translate('LabelSyncPlayMediaControlQuery'),
        buttons: [
            {
                name: globalize.translate('Allow'),
                id: 'allow',
                type: 'submit'
            },
            {
                name: globalize.translate('Deny'),
                id: 'deny',
                type: 'submit'
            }
        ]
    };

    const result = await dialog.show(options);
    if (result !== 'allow') {
        throw new Error('MediaControlNotAllowed');
    }
}

/**
 * Class that manages the playback permission.
 */
class PlaybackPermissionManager {
    /**
     * Tests playback permission. Grabs the permission when called inside a click event (or any other valid user interaction).
     * @returns {Promise} Promise that resolves in a boolean that indicates whether playback permission is allowed or not.
     */
    async check() {
        if (appHost.supports('htmlaudioautoplay')) {
            return true;
        }

        let status = false;
        const media = createTestMediaElement();

        try {
            await media.play();
            status = true;
        } catch (error) {
            status = false;
        } finally {
            destroyTestMediaElement(media);
        }

        return status;
    }

    /**
     * Shows an alert to grant playback permission, when needed.
     * @returns {Promise} Promise that resolves succesfully if playback permission is allowed.
     * @throws {Error} Throws MediaControlNotAllowed error if playback permission is missing.
     */
    async ask() {
        let status = await this.check();
        if (status) {
            // All done, playback permission already granted.
            return;
        }

        // Create an interaction with the user.
        await showDialog();

        // Using the user's click event we can now start playing something.
        status = await this.check();

        // Check result.
        if (!status) {
            throw new Error('MediaControlNotAllowed');
        }
    }
}

/** PlaybackPermissionManager singleton. */
export default new PlaybackPermissionManager();
