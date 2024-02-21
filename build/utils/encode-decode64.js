"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode64 = exports.decode64 = void 0;
const decode64 = (code) => {
    const buff = Buffer.from(code, 'base64').toString('utf-8');
    return buff;
};
exports.decode64 = decode64;
const encode64 = (code) => {
    const buff = Buffer.from(code, 'utf-8').toString('base64');
    return buff;
};
exports.encode64 = encode64;
