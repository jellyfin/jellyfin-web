/**
 * Controllers Index
 *
 * Barrel export for all migrated React views.
 * Replaces legacy JavaScript controllers with TypeScript/React components.
 */

// Authentication
export { default as Login } from './session/login/Login';
export { default as SelectServer } from './session/selectServer/SelectServer';

// Media Views
export { default as ListView } from './list/ListView';
export { default as Home } from './home/Home';
export { default as Favorites } from './favorites/Favorites';

// Movies
export { default as Movies } from './movies/Movies';
export { default as MoviesRecommended } from './movies/MoviesRecommended';

// Music
export { default as MusicAlbums } from './music/MusicAlbums';
export { default as Songs } from './music/Songs';
export { default as Artists } from './music/Artists';
export { default as MusicPlaylists } from './music/MusicPlaylists';
export { default as Playlists } from './Playlists';

// TV Shows
export { default as TVShows } from './shows/TVShows';
export { default as Episodes } from './shows/Episodes';
export { default as TVRecommended } from './shows/TVRecommended';

// Live TV
export { default as LiveTV } from './livetv/LiveTV';

// Item Details
export { default as ItemDetails } from './itemDetails/ItemDetails';

// Search & Discovery
export { default as Search } from './search/Search';
export { default as Genres } from './Genres';

// Dashboard (Admin)
export { default as Settings } from './dashboard/Settings';
export { default as Users } from './dashboard/Users';
export { default as Libraries } from './dashboard/Libraries';

// Utilities
export { default as lyrics } from './lyrics';
