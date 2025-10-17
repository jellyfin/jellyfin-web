import React from 'react';
import { Box, TextField, FormControlLabel, Checkbox, Typography } from '@mui/material';

const PlaylistCriteria = ({ criteria, onChange }) => {
  const updateCriteria = (updates) => {
    onChange({ ...criteria, ...updates });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
      <Typography variant="h6">⚙️ Playlist Settings</Typography>

      <TextField
        label="Duration (minutes)"
        type="number"
        value={criteria.duration || ''}
        onChange={(e) => updateCriteria({ duration: parseInt(e.target.value) || undefined })}
        helperText="Target playlist length"
        fullWidth
      />

      <TextField
        label="Item Limit"
        type="number"
        value={criteria.limit || ''}
        onChange={(e) => updateCriteria({ limit: parseInt(e.target.value) || undefined })}
        helperText="Max number of items"
        fullWidth
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={criteria.excludeWatched || false}
            onChange={(e) => updateCriteria({ excludeWatched: e.target.checked })}
          />
        }
        label="Exclude watched content"
      />
    </Box>
  );
};

export default PlaylistCriteria;