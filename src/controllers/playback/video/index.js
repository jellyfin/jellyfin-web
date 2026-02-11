import escapeHtml from 'escape-html';

import { PlayerEvent } from 'apps/stable/features/playback/constants/playerEvent';
import { AppFeature } from 'constants/appFeature';
import { TICKS_PER_MINUTE, TICKS_PER_SECOND } from 'constants/time';
import { EventType } from 'constants/eventType';

import { playbackManager } from '../../../components/playback/playbackmanager';
import browser from '../../../scripts/browser';
                playbackManager.decreasePlaybackRate(currentPlayer);
                break;
            case 'PageUp':
                if (!e.shiftKey) {
                    e.preventDefault();
                    playbackManager.nextChapter(currentPlayer);
                }
                break;
            case 'PageDown':
                if (!e.shiftKey) {
                    e.preventDefault();
                    playbackManager.previousChapter(currentPlayer);
                }
                break;
            case 'g':
            case 'G':
                if (!e.shiftKey) {
                    e.preventDefault();
                    subtitleSyncOverlay?.decrementOffset();
                }
                break;
            case 'h':
            case 'H':
                if (!e.shiftKey) {
                    e.preventDefault();
                    subtitleSyncOverlay?.incrementOffset();
                }
                break;
        }
    }


    function onKeyDownCapture() {
        resetIdle();
    }


    function onWheel(e) {
        if (getOpenedDialog()) return;
        const path = e.composedPath ? e.composedPath() : null;
        if (path) {
            for (const node of path) {
                if (node && node.classList && node.classList.contains('playerStats')) {
                    return;
                }
            }
        } else {
            for (let node = e.target; node; node = node.parentNode || node.host || null) {
                if (node.classList && node.classList.contains('playerStats')) {
                    return;
                }
            }
        }


        if (e.deltaY < 0) {
            playbackManager.volumeUp(currentPlayer);
        }
        if (e.deltaY > 0) {
            playbackManager.volumeDown(currentPlayer);
        }
    }


    function onWindowMouseDown(e) {
        clickedElement = e.target;
        mouseIsDown = true;
        resetIdle();
    }


    function onWindowMouseUp() {
        mouseIsDown = false;
        resetIdle();
    }

