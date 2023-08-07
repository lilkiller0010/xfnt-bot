export const isInvalidURLRedirect = (
  inputString: string,
  charactersToCheck: string[],
): boolean => {
  const containsAnyCharacter = charactersToCheck.some((char) =>
    inputString.includes(char),
  );

  return containsAnyCharacter;
};
