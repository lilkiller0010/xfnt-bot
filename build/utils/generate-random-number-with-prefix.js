"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomNumberWithPrefix = void 0;
const generateRandomNumberWithPrefix = (prefix, length) => {
    const randomNum = Math.floor(Math.random() * Math.pow(10, length));
    const formattedRandomNum = randomNum.toString().padStart(length, '0');
    return prefix + formattedRandomNum;
};
exports.generateRandomNumberWithPrefix = generateRandomNumberWithPrefix;
