import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../home/Home';
import { SmartPlaylistGenerator } from '../smart-playlist';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Other existing routes */}
      <Route path="/smart-playlist" element={<SmartPlaylistGenerator />} />
    </Routes>
  );
};

export default AppRouter;