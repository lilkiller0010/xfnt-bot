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
exports.runWebScraping = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chunk_1 = __importDefault(require("lodash/chunk"));
const logger_1 = __importDefault(require("./logger/logger"));
const utils_1 = require("./utils");
const getCredentialInformationScrapper_1 = require("./getCredentialInformationScrapper");
const GROUP_PER_PARTIAL_CREDENTIAL = 20;
const CHANGE_TABS_SECONDS = 1;
const BLANK_PAGE_URL = 'about:blank';
const runWebScraping = (time, comboListFileName) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch({
        headless: false,
        args: ['--no-sandbox'],
    });
    try {
        const credentials = yield (0, utils_1.getCredentials)(comboListFileName);
        const partialCredentialsChunkSize = 1000;
        const partialCredentials = (0, chunk_1.default)(credentials, partialCredentialsChunkSize);
        /**
         * LOGS for combo list informations
         */
        logger_1.default.warn(`TOTAL CREDENTIALS: ${credentials.length}`);
        logger_1.default.warn(`PARTIAL_CREDENTIAL_SCHUNK_SIZE: ${partialCredentialsChunkSize}`);
        logger_1.default.warn(`QUANTITY OF PARTIAL_CREDENTIALS: ${partialCredentials.length}`);
        logger_1.default.warn(`GROUP_PER_PARTIAL_CREDENTIAL: ${GROUP_PER_PARTIAL_CREDENTIAL}`);
        logger_1.default.warn(`CHANGE_TABS_SECONDS: ${CHANGE_TABS_SECONDS}`);
        /**
         * END LOGS for combo list informations
         */
        let lastPageSelectedIndex = 0;
        const intervalChangeTabs = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const pages = yield browser.pages();
            const pagesWithoutEmpty = pages.filter((page) => page.url() !== BLANK_PAGE_URL);
            if (lastPageSelectedIndex >= pagesWithoutEmpty.length) {
                lastPageSelectedIndex = 0;
            }
            let currentPage = pagesWithoutEmpty[lastPageSelectedIndex];
            if (currentPage) {
                currentPage.bringToFront();
            }
            lastPageSelectedIndex++;
        }), CHANGE_TABS_SECONDS * 1000);
        logger_1.default.warn('STARTING BOT...');
        for (let index = 0; index < partialCredentials.length; index++) {
            // 1000 credentials per file
            const currentPartialCredential = partialCredentials[index];
            const VALID_PREFIX_FILE = `${comboListFileName} [`;
            const INVALID_PREFIX_FILE = `${comboListFileName} [`;
            const FILE_EXTENSION = '.txt';
            const validFileNameRange = `${(0, utils_1.getFileNameRange)(VALID_PREFIX_FILE, index, partialCredentialsChunkSize, credentials.length)}] VALID ${time}`;
            const invalidFileNameRange = `${(0, utils_1.getFileNameRange)(INVALID_PREFIX_FILE, index, partialCredentialsChunkSize, credentials.length)}] INVALID ${time}`;
            const validFileDirectory = path_1.default.join(`${__dirname}/data/combo-lists`);
            if (!fs_1.default.existsSync(validFileDirectory)) {
                fs_1.default.mkdirSync(validFileDirectory, { recursive: true });
            }
            const validFilePath = path_1.default.join(validFileDirectory, `${validFileNameRange}${FILE_EXTENSION}`);
            const invalidFilePath = path_1.default.join(`${__dirname}/data/combo-lists`, `${invalidFileNameRange}${FILE_EXTENSION}`);
            const validWritableStream = fs_1.default.createWriteStream(validFilePath, 'utf8');
            const invalidWritableStream = fs_1.default.createWriteStream(invalidFilePath, 'utf8');
            validWritableStream.on('error', (error) => {
                logger_1.default.error(`ERROR WHILE WRITING FILE: ${error}`);
                throw `Error while writing file [${validFilePath}]: ${error}`;
            });
            invalidWritableStream.on('error', (error) => {
                logger_1.default.error(`ERROR WHILE WRITING FILE: ${error}`);
                throw `Error while writing file [${invalidFilePath}]: ${error}`;
            });
            const validWriteLineOnFile = (line) => {
                validWritableStream.write(`${line}\r\n`, 'utf8');
            };
            const invalidWriteLineOnFile = (line) => {
                invalidWritableStream.write(`${line}\r\n`, 'utf8');
            };
            logger_1.default.warn(`Starting to insert credentials on file ${validFileNameRange}...`, (0, utils_1.getFileNameRange)(VALID_PREFIX_FILE, index, partialCredentialsChunkSize, credentials.length));
            const credentialsChunks = (0, chunk_1.default)(currentPartialCredential, GROUP_PER_PARTIAL_CREDENTIAL);
            for (const credentialChunk of credentialsChunks) {
                try {
                    yield Promise.all(credentialChunk.map((credential) => __awaiter(void 0, void 0, void 0, function* () {
                        yield (0, getCredentialInformationScrapper_1.getCredentialInformationScrapper)(browser, credential, validWriteLineOnFile, invalidWriteLineOnFile, validFileNameRange);
                    })));
                }
                catch (error) {
                    logger_1.default.error(`ERROR ON FOR OF: ${error}`);
                }
            }
        }
        clearInterval(intervalChangeTabs);
    }
    catch (error) {
        logger_1.default.error(`ERROR ON HEAD WEB SCRAPING: ${error}`);
        console.error(error);
        yield browser.close();
    }
});
exports.runWebScraping = runWebScraping;
