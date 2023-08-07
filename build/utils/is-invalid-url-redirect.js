"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInvalidURLRedirect = void 0;
const isInvalidURLRedirect = (inputString, charactersToCheck) => {
    const containsAnyCharacter = charactersToCheck.some((char) => inputString.includes(char));
    return containsAnyCharacter;
};
exports.isInvalidURLRedirect = isInvalidURLRedirect;
