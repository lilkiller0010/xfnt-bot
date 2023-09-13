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
  americanWebLoan: PageConfiguration;
  withULoans: PageConfiguration;
}

const CONFIGURATION_PER_PAGE: ConfigurationPerPage = {
  americanWebLoan: {
    pageUrl: 'https://www.americanwebloan.com/',
    loanAmountSelector: '#amount',
    formSelector: '#homepage-form',
  },
  withULoans: {
    pageUrl: 'https://www.withuloans.com/',
    loanAmountSelector: '#amount',
    formSelector: '#get-started-form',
  },
};

const SELECTORS = {
  firstNameInput: '#firstName',
  lastNameInput: '#lastName',
  emailInput: '#email',
  ssnInput: '#ssn',
  applyNowButton: 'input[type=submit]',
};

const validateIp = (ip: string) => {};

export const getCredentialInformationScrapper = async (
  browser: Browser,
  credential: Credential,
  validWriteLineOnFile: (line: string) => void,
  invalidWriteLineOnFile: (line: string) => void,
  validFileName: string,
  pageConfigKey: keyof ConfigurationPerPage,
) => {
  const { pageUrl } = CONFIGURATION_PER_PAGE[pageConfigKey];

  const HEADLESS = false;

  const _browser = await pupeeteer.launch({
    headless: HEADLESS,
    // headless: false,
    args: ['--no-sandbox'],
  });

  // const page = await browser.newPage();
  let page = await _browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  const invalidIPs = ['37.120.215.171', '37.120.215.167'];
  // validation ip

  let isInvalidIp = true;

  // const loanAmountValue = getLoanAmountValue();

  try {
    await page.goto(pageUrl, {
      waitUntil: 'networkidle2',
    });

    while (isInvalidIp) {
      const { data: ip } = await axios.get<string>('https://api.ipify.org');

      console.log({ ip: ip });

      isInvalidIp = invalidIPs.includes(ip);

      if (isInvalidIp) {
        await page.close();

        page = await _browser.newPage();

        await page.setViewport({
          width: 1920,
          height: 1080,
        });

        await page.goto(pageUrl, {
          waitUntil: 'networkidle2',
        });
      }

      await new Promise((r) => setTimeout(r, 3000));
    }

    console.log('out of loop');

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

    await page.type(SELECTORS.lastNameInput, credential.lastname);

    await page.type(SELECTORS.firstNameInput, credential.name);

    await page.type(SELECTORS.emailInput, credential.email);

    await page.type(SELECTORS.ssnInput, credential.last4ssn);

    await Promise.all([
      await page.click(SELECTORS.applyNowButton),
      await page.waitForNavigation({
        timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
        waitUntil: 'networkidle0',
      }),
    ]);

    await new Promise((r) => setTimeout(r, 1000));

    const outputMessage = generateOutputMessage(credential, page.url());

    logger.info(outputMessage);

    validWriteLineOnFile(outputMessage);

    if (SCREENSHOT_DISABLED) {
      await page.screenshot({
        path: screenshotRedirectPath,
      });
    }
  } catch (error) {
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
