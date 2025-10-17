export const calculateSimilarity = (item1: any, item2: any): number => {
  let score = 0;
  const commonGenres = item1.Genres?.filter((g: string) => item2.Genres?.includes(g)) || [];
  score += (commonGenres.length / Math.max(item1.Genres?.length || 1, 1)) * 0.5;
  if (item1.ProductionYear && item2.ProductionYear) {
    const yearDiff = Math.abs(item1.ProductionYear - item2.ProductionYear);
    score += Math.max(0, 1 - yearDiff / 50) * 0.3;
  }
  if (item1.Type === item2.Type) score += 0.2;
  return score;
};