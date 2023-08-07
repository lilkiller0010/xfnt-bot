import { createLogger, format, transports, LoggerOptions } from 'winston';

const { combine, timestamp, label, printf, colorize, prettyPrint, errors } =
  format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const loggerDefaultFormat: LoggerOptions['format'] = combine(
  timestamp(),
  prettyPrint(),
  errors({ stack: true }),
  myFormat,
);

const logger = createLogger({
  format: loggerDefaultFormat,
  transports: [
    new transports.Console({
      format: combine(loggerDefaultFormat, colorize({ all: true })),
    }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
