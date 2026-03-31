export const generateDraw = (): number[] => {
  const numbers: number[] = [];
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) numbers.push(num);
  }
  return numbers;
};

export const generateAlgorithmicDraw = (
  scoreFrequency: Record<number, number>
): number[] => {
  const pool: number[] = [];
  for (let num = 1; num <= 45; num++) {
    const weight = (scoreFrequency[num] ?? 0) + 1;
    for (let w = 0; w < weight; w++) {
      pool.push(num);
    }
  }

  const drawn: number[] = [];
  const remaining = [...pool];

  while (drawn.length < 5) {
    const idx = Math.floor(Math.random() * remaining.length);
    const pick = remaining[idx];
    if (!drawn.includes(pick)) {
      drawn.push(pick);
    }
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i] === pick) remaining.splice(i, 1);
    }
  }

  return drawn;
};

export const buildFrequencyMap = (scores: number[]): Record<number, number> => {
  return scores.reduce<Record<number, number>>((acc, s) => {
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
};