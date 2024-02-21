"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentials = void 0;
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("../logger/logger"));
const getCredentials = async (comboListFileName) => {
    // try {
    //   const readFileLines = async (filename: string) => {
    //     const file = await fs.promises.readFile(filename, { encoding: 'utf8' });
    //     return file.split(/\n/);
    //   };
    //   const _comboListFileName = `${comboListFileName}.txt`;
    //   const comboList: Credential[] = (await readFileLines(_comboListFileName))
    //     .map<Credential>((combo) => {
    //       const [
    //         id,
    //         name,
    //         lastname,
    //         bid,
    //         address,
    //         city,
    //         state,
    //         zipCode,
    //         phoneNumber,
    //         phoneNumber2,
    //         email,
    //         ssn,
    //       ] = combo.trim().split(':');
    //       return {
    //         id,
    //         name,
    //         lastname,
    //         bid,
    //         address,
    //         city,
    //         state,
    //         zipCode,
    //         phoneNumber,
    //         phoneNumber2,
    //         email,
    //         ssn,
    //         last4ssn: ssn.slice(-4),
    //       };
    //     })
    //     .filter(
    //       (credential) =>
    //         credential?.name &&
    //         credential?.lastname &&
    //         credential?.ssn &&
    //         credential?.email &&
    //         credential?.last4ssn,
    //     );
    //   logger.debug('COMBO LIST FETCHED');
    //   return comboList;
    // } catch (error) {
    //   logger.error(`COMBO LIST FILENAME INVALID! FILENAME=${comboListFileName}`);
    //   throw `Error while fetching combo list: ${error}`;
    // }
    try {
        const readFileLines = async (filename) => {
            const file = await fs_1.default.promises.readFile(filename, { encoding: 'utf8' });
            return file.split(/\n\n+/);
        };
        const _comboListFileName = `${comboListFileName}.txt`;
        const comboList = (await readFileLines(_comboListFileName))
            .filter(Boolean)
            .map((a) => {
            let ssn = a.split(/SSN/i)[1].split(/\n/)[0].replace(/[: -]/g, '');
            let bid = a.split(/DOB/i)[1].split(/\n/)[0].replace(/[: ]/g, '');
            return { ssn, bid };
        })
            .filter((credential) => credential?.bid && credential?.ssn);
        logger_1.default.debug('COMBO LIST FETCHED');
        return comboList;
    }
    catch (error) {
        logger_1.default.error(`COMBO LIST FILENAME INVALID! FILENAME=${comboListFileName}`);
        throw `Error while fetching combo list: ${error}`;
    }
};
exports.getCredentials = getCredentials;
