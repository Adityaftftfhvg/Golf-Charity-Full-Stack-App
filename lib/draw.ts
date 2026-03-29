export const generateDraw = () => {
  let numbers: number[] = [];

  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) numbers.push(num);
  }

  return numbers;
};