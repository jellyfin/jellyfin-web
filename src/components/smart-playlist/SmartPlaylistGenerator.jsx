import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import MoodSelector from './MoodSelector';
import PlaylistCriteria from './PlaylistCriteria';
import { useSmartPlaylist } from './useSmartPlaylist';

// Remove TypeScript interfaces
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const SmartPlaylistGenerator = () => {
  const [criteria, setCriteria] = useState({});
  const [generatedPlaylist, setGeneratedPlaylist] = useState(null);
  const { generatePlaylist, isGenerating } = useSmartPlaylist();

  const handleGenerate = async () => {
    const playlist = await generatePlaylist(criteria);
    setGeneratedPlaylist(playlist);
  };

  const handleSavePlaylist = () => {
    console.log('Saving playlist:', generatedPlaylist);
    alert('Playlist saved! (Demo mode)');
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h4" gutterBottom color="primary">
        🎵 Smart Playlist Generator
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create intelligent playlists based on mood and preferences
      </Typography>

      <MoodSelector
        selectedMood={criteria.mood}
        onMoodChange={(mood) => setCriteria(prev => ({ ...prev, mood }))}
      />

      <PlaylistCriteria
        criteria={criteria}
        onChange={setCriteria}
      />

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleGenerate}
          disabled={isGenerating}
          startIcon={isGenerating ? <CircularProgress size={20} /> : undefined}
          sx={{ minWidth: 200 }}
        >
          {isGenerating ? 'Generating...' : 'Generate Playlist'}
        </Button>
      </Box>

      {generatedPlaylist && (
        <Box sx={{ mt: 4, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            🎉 Playlist Generated Successfully!
          </Alert>

          <Typography variant="h6" gutterBottom>
            {generatedPlaylist.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {generatedPlaylist.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={`${generatedPlaylist.items.length} items`}
              size="small"
              color="primary"
            />
            <Chip
              label={formatDuration(generatedPlaylist.totalDuration)}
              size="small"
              color="secondary"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {generatedPlaylist.items.slice(0, 5).map(item => (
              <Chip
                key={item.Id}
                label={item.Name}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>

          <Button
            variant="contained"
            color="success"
            onClick={handleSavePlaylist}
            fullWidth
          >
            💾 Save to Library
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default SmartPlaylistGenerator;