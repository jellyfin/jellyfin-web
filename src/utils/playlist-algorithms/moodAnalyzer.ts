// ...existing code...
export type PlaylistMood = 'chill' | 'energetic' | 'focus' | 'romantic' | 'adventurous';

export const moodProfiles: Record<PlaylistMood, string[]> = {
  chill: ['Comedy', 'Animation', 'Documentary', 'Romance'],
  energetic: ['Action', 'Adventure', 'Sci-Fi', 'Sports'],
  focus: ['Documentary', 'Educational', 'Biography', 'History'],
  romantic: ['Romance', 'Drama', 'Musical'],
  adventurous: ['Adventure', 'Fantasy', 'Action', 'Thriller']
};

export const getMoodGenres = (mood: PlaylistMood): string[] => {
  return moodProfiles[mood] || [];
};
// ...existing code...