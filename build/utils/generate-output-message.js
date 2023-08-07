"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOutputMessage = void 0;
const logger_1 = __importDefault(require("../logger/logger"));
const generateOutputMessage = (crendential, loanAmountValue, isWelcomeBack, url, referrerURL) => {
    const { email, ssn } = crendential;
    if (isWelcomeBack) {
        const validMessage = `EMAIL=${email} SSN=${ssn} LOAN_AMOUNT=${loanAmountValue} IS_WELCOME_BACK=${isWelcomeBack}  URL=${url} ${referrerURL ? `REFERRER_URL=${referrerURL} ` : ''}VALID`;
        return validMessage;
    }
    else {
        const invalidMessage = `EMAIL=${email} SSN=${ssn} LOAN_AMOUNT=${loanAmountValue} IS_WELCOME_BACK=${isWelcomeBack} INVALID`;
        logger_1.default.error(`EMAIL=${email} SSN=${ssn} LOAN_AMOUNT=${loanAmountValue} IS_WELCOME_BACK=${isWelcomeBack} INVALID`);
        return invalidMessage;
    }
};
exports.generateOutputMessage = generateOutputMessage;
