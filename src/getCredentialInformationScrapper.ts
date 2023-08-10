import { Browser } from 'puppeteer';
import { Credential } from './interface/credential';
import {
  INVALID_URL_REDIRECT,
  LOAN_AMOUNTS,
  TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES,
  TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES,
} from './constants';
import {
  generateOutputMessage,
  getRamdomValue,
  isInvalidURLRedirect,
  minutesToMilliseconds,
} from './utils';
import path from 'path';
import fs from 'fs';
import logger from './logger/logger';

export enum REFERRER_HOSTS {
  STORE_FRONTLOANS = 'forms.storefrontloans.com',
  INTMCONNECT = 'intmconnect.com',
  ESIGNINGAPP = 'esigningapp.com',
  OFFERDETAILS = 'offerdetails.net',
}

export const TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS = minutesToMilliseconds(
  TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES,
);

export const TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MILLISECONDS =
  minutesToMilliseconds(TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES);

export const SCREENSHOT_DISABLED = true;

export const REFERRER_HOSTS_URL: string[] = [
  'forms.storefrontloans.com',
  'intmconnect.com',
  'esigningapp.com',
  'offerdetails.net',
  'consumertransferservice.com',
  'go-us.stopgonet.com',
];

export const RE_REFERRER_HOSTS_URL: string[] = [
  'forms.storefrontloans.com',
  'offerdetails.net',
  'consumertransferservice.com',
  'go-us.stopgonet.com',
];

const logTracking = (message: string, email: string) => {
  logger.warn(`${message} || ${email}`);
};

const getLoanAmountValue = () =>
  LOAN_AMOUNTS[getRamdomValue(0, LOAN_AMOUNTS.length - 1)];

const isReferrerHostURL = (url: string) => {
  const host = new URL(url).host;

  return REFERRER_HOSTS_URL.some((referrerHost) => host.includes(referrerHost));
};

const isReReferrerHostURL = (url: string) => {
  const host = new URL(url).host;

  return RE_REFERRER_HOSTS_URL.some((referrerHost) =>
    host.includes(referrerHost),
  );
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

export const getCredentialInformationScrapper = async (
  browser: Browser,
  credential: Credential,
  validWriteLineOnFile: (line: string) => void,
  invalidWriteLineOnFile: (line: string) => void,
  validFileName: string,
) => {
  const page = await browser.newPage();

  const loanAmountValue = getLoanAmountValue();

  let firstURL = '';
  let referrerURL = '';
  let firstURLHost = '';
  let isWelcomeBack = false;

  try {
    const screenshotRedirectDirectory = path.join(
      `${__dirname}/data/screenshots-redirect/${validFileName}`,
    );

    if (!fs.existsSync(screenshotRedirectDirectory)) {
      fs.mkdirSync(screenshotRedirectDirectory, { recursive: true });
    }

    const screenshotRedirectPath = path.join(
      `${screenshotRedirectDirectory}/${credential.email}.png`,
    );

    await page.goto(PAGE_URL, {
      waitUntil: 'networkidle2',
    });

    //TODO: Verify this session code
    const session = await page.target().createCDPSession();
    await session.send('Page.enable');
    await session.send('Page.setWebLifecycleState', { state: 'active' });

    await page.select(loanAmountSelector, loanAmountValue);

    await page.type(emailSelector, credential.email);
    await page.type(ssnSelector, credential.ssn);

    const form = await page.$(formSelector);

    await Promise.all([
      await form?.evaluate((form) => form.submit()),
      await page.waitForNavigation({
        timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
        waitUntil: 'networkidle0',
      }),
    ]);

    isWelcomeBack = (await page.$(submitLoanRequestButtonSelector))
      ? true
      : false;

    if (isWelcomeBack) {
      // await page.screenshot({
      //   path: screenshotPath, //ACTIVE TO SCREENSHOT WHEN IS WELCOME BACK
      // });

      await page.click(termsAndConditionsCheckBoxSelector);

      const submitLoanRequestButton = await page.$(
        submitLoanRequestButtonSelector,
      );

      await Promise.all([
        await submitLoanRequestButton?.evaluate((e) => e.click()),
        logger.warn(`VALIDATING: ${credential.email}`),
        await page.waitForNavigation({
          timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
          waitUntil: 'networkidle2',
        }),
      ]);

      await new Promise((r) => setTimeout(r, 2000));

      if (isInvalidURLRedirect(page.url(), INVALID_URL_REDIRECT)) {
        await page.close();

        return logger.error(
          `INVALID URL REDIRECT: ${page.url()} - EMAIL:${
            credential.email
          } SSN=${credential.ssn} LOAN_AMOUNT=${loanAmountValue}`,
        );
      }

      if (isReferrerHostURL(page.url())) {
        firstURL = page.url();
        firstURLHost = new URL(firstURL).host;

        logger.warn(
          `VALIDATING REFERRER_HOSTS [${firstURLHost}] : ${credential.email}`,
        );

        await page.waitForNavigation({
          timeout: TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MILLISECONDS,
          waitUntil: 'networkidle2',
        });

        // first opportunity to get a referrer
        if (isReReferrerHostURL(page.url())) {
          logger.warn(
            `VALIDATING RE_REFERRER_HOSTS  1st opp firstURLHost=[${firstURLHost}] || currentURL=[${page.url()}] ${
              credential.email
            }`,
          );

          await page.waitForNavigation({
            timeout: TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MILLISECONDS,
            waitUntil: 'networkidle2',
          });
        }

        // second opportunity to get a referrer
        if (isReReferrerHostURL(page.url())) {
          logger.warn(
            `VALIDATING RE_REFERRER_HOSTS  2nd opp firstURLHost=[${firstURLHost}] || currentURL=[${page.url()}] ${
              credential.email
            }`,
          );

          await page.waitForNavigation({
            timeout: TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MILLISECONDS,
            waitUntil: 'networkidle2',
          });
        }

        referrerURL = page.url();

        const outputMessage = generateOutputMessage(
          credential,
          loanAmountValue,
          isWelcomeBack,
          firstURL,
          referrerURL,
        );

        logger.info(outputMessage);

        validWriteLineOnFile(outputMessage);

        if (SCREENSHOT_DISABLED) {
          await page.screenshot({
            path: screenshotRedirectPath,
          });
        }

        await page.close();

        return 0;
      }

      if (SCREENSHOT_DISABLED) {
        await page.screenshot({
          path: screenshotRedirectPath,
        });
      }

      const outputMessage = generateOutputMessage(
        credential,
        loanAmountValue,
        isWelcomeBack,
        page.url(),
      );

      await new Promise((r) => setTimeout(r, 4000));

      logger.info(outputMessage);

      validWriteLineOnFile(outputMessage);

      await page.close();
    } else {
      const outputMessage = generateOutputMessage(
        credential,
        loanAmountValue,
        isWelcomeBack,
      );

      invalidWriteLineOnFile(outputMessage);

      logger.error(outputMessage);

      await page.close();
    }
  } catch (error) {
    logTracking(
      `ERROR WITH ${credential.email}!!!`,
      `${credential.email} || firstURLHost=${firstURLHost} || referrerURL=${referrerURL}`,
    );

    logger.error(`getCredentialInformationScrapper ERROR: ${error}`);

    let outputMessage = '';

    if (firstURL) {
      outputMessage = generateOutputMessage(
        credential,
        loanAmountValue,
        isWelcomeBack,
        firstURL,
        referrerURL,
        true,
      );
    } else {
      outputMessage = generateOutputMessage(
        credential,
        loanAmountValue,
        isWelcomeBack,
        page.url(),
        referrerURL,
        true,
      );
    }

    validWriteLineOnFile(outputMessage);

    logger.info(outputMessage);

    await page.close();
  }
};
