"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileNameRange = void 0;
const getFileNameRange = (prefix, index, chunkSize, lengthOriginalArray) => {
    const numberIndex = index + 1;
    const currentSize = chunkSize * numberIndex;
    if (currentSize > lengthOriginalArray) {
        return `${prefix}${index * chunkSize + 1}-${lengthOriginalArray}`;
    }
    return `${prefix}${index * chunkSize + 1}-${currentSize}`;
};
exports.getFileNameRange = getFileNameRange;
