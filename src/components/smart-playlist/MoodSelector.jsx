import React from 'react';
import { Box, Chip, Typography } from '@mui/material';

// Remove TypeScript types, use PropTypes or no types
const moods = [
  { id: 'chill', label: 'Chill', emoji: '😌' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'focus', label: 'Focus', emoji: '🎯' },
  { id: 'romantic', label: 'Romantic', emoji: '💖' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🌍' }
];

// Remove TypeScript interfaces, use simple props
const MoodSelector = ({ selectedMood, onMoodChange }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        🎭 Select Mood
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {moods.map(mood => (
          <Chip
            key={mood.id}
            label={`${mood.emoji} ${mood.label}`}
            clickable
            color={selectedMood === mood.id ? 'primary' : 'default'}
            onClick={() => onMoodChange(mood.id)}
            variant={selectedMood === mood.id ? 'filled' : 'outlined'}
          />
        ))}
      </Box>
    </Box>
  );
};

export default MoodSelector;