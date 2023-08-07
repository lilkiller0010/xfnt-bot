"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRamdomValue = void 0;
const getRamdomValue = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
exports.getRamdomValue = getRamdomValue;
