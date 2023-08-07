"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { combine, timestamp, label, printf, colorize, prettyPrint, errors } = winston_1.format;
const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
const loggerDefaultFormat = combine(timestamp(), prettyPrint(), errors({ stack: true }), myFormat);
const logger = (0, winston_1.createLogger)({
    format: loggerDefaultFormat,
    transports: [
        new winston_1.transports.Console({
            format: combine(loggerDefaultFormat, colorize({ all: true })),
        }),
        new winston_1.transports.File({ filename: 'logs/combined.log' }),
    ],
});
exports.default = logger;
