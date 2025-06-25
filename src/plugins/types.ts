import {default as backdropScreensaver} from "./backdropScreensaver/plugin.ts";
import {default as bookPlayer} from "./bookPlayer/plugin.ts";
export {default as chromecastPlayer} from "./chromecastPlayer/plugin.ts";
import {default as chromecastPlayer} from "./chromecastPlayer/plugin.ts";
import {default as comicsPlayer} from "./comicsPlayer/plugin.ts";
import {default as experimentalWarnings} from "./experimentalWarnings/plugin.ts";
import {default as htmlAudioPlayer} from "./htmlAudioPlayer/plugin.ts";
import {default as htmlVideoPlayer} from "./htmlVideoPlayer/plugin.ts";
// import {default as logoScreensaver} from "./logoScreensaver/plugin.ts";
import {default as pdfPlayer} from "./pdfPlayer/plugin.ts";
import {default as photoPlayer} from "./photoPlayer/plugin.ts";
import {default as playAccessValidation} from "./playAccessValidation/plugin.ts";
import {default as sessionPlayer} from "./sessionPlayer/plugin.ts";
export {default as sessionPlayer} from "./sessionPlayer/plugin.ts";
import {default as syncPlay} from "./syncPlay/plugin.ts";
import {default as youtubePlayer} from "./youtubePlayer/plugin.ts";
export { Plugin, PluginType } from 'types/plugin';
export type AllPlugins = backdropScreensaver | bookPlayer | chromecastPlayer | comicsPlayer | experimentalWarnings |
	htmlAudioPlayer | htmlVideoPlayer /*| typeof logoScreensaver */ | pdfPlayer | photoPlayer | playAccessValidation | sessionPlayer | syncPlay | youtubePlayer;


/**
 *     name: string;
    id: string;
    type: string;
    priority: number;
    instance: typeof SyncPlay;
	    name: string;
    type: PluginType;
    id: string;
    supportsAnonymous: boolean;
    currentSlideshow: any = null;
 *
 *
 */
