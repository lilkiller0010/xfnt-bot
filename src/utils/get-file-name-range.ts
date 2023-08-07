export const getFileNameRange = (
  prefix: string,
  index: number,
  chunkSize: number,
  lengthOriginalArray: number,
): string => {
  const numberIndex = index + 1;

  const currentSize = chunkSize * numberIndex;

  if (currentSize > lengthOriginalArray) {
    return `${prefix}${index * chunkSize + 1}-${lengthOriginalArray}`;
  }

  return `${prefix}${index * chunkSize + 1}-${currentSize}`;
};
