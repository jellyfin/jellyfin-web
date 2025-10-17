import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';

const PlaylistDisplay = ({ playlist, loading }) => {
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Finding perfect movies for you...
        </Typography>
      </Box>
    );
  }

  if (playlist.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Select a mood and click "Create Playlist" to generate your smart playlist!
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        🎬 Your Playlist ({playlist.length} movies)
      </Typography>
      
      <List>
        {playlist.map((movie, index) => (
          <ListItem key={index} divider>
            <ListItemText 
              primary={`${index + 1}. ${movie.name}`}
              secondary={`Duration: ${movie.duration}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PlaylistDisplay;