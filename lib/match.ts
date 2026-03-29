export const countMatches = (userScores: number[], draw: number[]) => {
  return userScores.filter((num) => draw.includes(num)).length;
};