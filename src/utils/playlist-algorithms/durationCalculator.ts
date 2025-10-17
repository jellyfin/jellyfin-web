export const calculateDuration = (items: any[]): number => {
  return items.reduce((total, item) => total + (item.RunTimeTicks ? item.RunTimeTicks / 600000000 : 0), 0);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};