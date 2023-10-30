export const generateRandomNumberWithPrefix = (
  prefix: string,
  length: number,
) => {
  const randomNum = Math.floor(Math.random() * Math.pow(10, length));
  const formattedRandomNum = randomNum.toString().padStart(length, '0');
  return prefix + formattedRandomNum;
};
