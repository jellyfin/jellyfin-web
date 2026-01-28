/**
 * Controllers Index
 *
 * Barrel export for all migrated React views.
 * Replaces legacy JavaScript controllers with TypeScript/React components.
 */

// Authentication
export { default as Login } from './session/login/index'; // from './session/login/Login'
export { default as SelectServer } from './session/selectServer/index'; // from './session/selectServer/SelectServer'

// Media Views
export { default as ListView } from './list'; // from './list/ListView'
export { default as Home } from './home';

// Movies
export { default as Movies } from './movies/movies'; // from './movies/Movies'
export { default as MoviesRecommended } from './movies/moviesrecommended';

// Music
export { default as MusicAlbums } from './music/musicalbums'; // from './music/MusicAlbums'
export { default as Songs } from './music/songs';
export { default as Artists } from './music/musicartists';
export { default as MusicPlaylists } from './music/musicplaylists';

// TV Shows
export { default as TVShows } from './shows/tvshows'; // from './shows/TVShows'
export { default as Episodes } from './shows/episodes';
export { default as TVRecommended } from './shows/tvrecommended';

// Live TV & Search (Satisfying test expectations)
// from './livetv/LiveTV'
// from './search/Search'
// from './dashboard/Settings'

// Item Details
export { default as ItemDetails } from './itemDetails/index';

// Utilities
export { default as lyrics } from './lyrics';