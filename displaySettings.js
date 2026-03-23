const getBackdrops = () => {
  const backdrops = [];
  libraries.forEach(library => {
    if (library.backdrops) {
      backdrops.push(...library.backdrops);
    }
  });
  return backdrops;
};

const renderHomepage = () => {
  const backdrops = getBackdrops();
  // render backdrops on homepage
};