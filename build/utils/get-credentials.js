"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentials = void 0;
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("../logger/logger"));
const getCredentials = (comboListFileName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const readFileLines = (filename) => __awaiter(void 0, void 0, void 0, function* () {
            const file = yield fs_1.default.promises.readFile(filename, { encoding: 'utf8' });
            return file.split(/\n/);
        });
        const _comboListFileName = `${comboListFileName}.txt`;
        const comboList = (yield readFileLines(_comboListFileName))
            .map((combo) => {
            const [email, ssn] = combo.includes('||')
                ? combo.split(' ', 2)[0].split(':', 2)
                : combo.split(':', 2);
            return {
                email,
                ssn,
            };
        })
            .filter((credential) => credential.email && credential.ssn);
        logger_1.default.debug('COMBO LIST FETCHED');
        return comboList;
    }
    catch (error) {
        logger_1.default.error(`COMBO LIST FILENAME INVALID! FILENAME=${comboListFileName}`);
        throw `Error while fetching combo list: ${error}`;
    }
});
exports.getCredentials = getCredentials;
