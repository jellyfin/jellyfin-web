/**
 * Controllers Index
 *
 * Barrel export for all migrated React views.
 * Replaces legacy JavaScript controllers with TypeScript/React components.
 */

// Authentication
export { default as Login } from './session/login/index';
export { default as SelectServer } from './session/selectServer/index';

// Media Views
export { default as ListView } from './list';
export { default as Home } from './home';

// Movies
export { default as Movies } from './movies/movies';
export { default as MoviesRecommended } from './movies/moviesrecommended';

// Music
export { default as MusicAlbums } from './music/musicalbums';
export { default as Songs } from './music/songs';
export { default as Artists } from './music/musicartists';
export { default as MusicPlaylists } from './music/musicplaylists';

// TV Shows
export { default as TVShows } from './shows/tvshows';
export { default as Episodes } from './shows/episodes';
export { default as TVRecommended } from './shows/tvrecommended';

// Item Details
export { default as ItemDetails } from './itemDetails/index';

// Utilities
export { default as lyrics } from './lyrics';