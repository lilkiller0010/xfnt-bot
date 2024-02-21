import fs from 'fs';
import { BotConfig } from '../interface/bot-config';

const BOT_CONFIG_FILE_NAME = 'bot-config.json';

export const getBotConfig = async () => {
  try {
    const file = await fs.promises.readFile(BOT_CONFIG_FILE_NAME, {
      encoding: 'utf8',
    });

    const botConfig = JSON.parse(file) as BotConfig;

    if (
      botConfig['hits-folder-name'] &&
      botConfig['license-key'] &&
      botConfig.proxy &&
      botConfig.openBrowser
    ) {
      let proxy = botConfig.proxy;
      let proxyValidator = new RegExp(
        /^(?:(\w+)(?::(\w+))?@)?((?:\d{1,3})(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/,
      );

      if (!proxyValidator.test(proxy)) {
        throw Error('Please check proxy format in bot-config.json');
      }

      const openBrowserValidValues = ['yes', 'no'];

      if (!openBrowserValidValues.includes(botConfig.openBrowser)) {
        throw Error('openBrowser option is invalid');
      }
    } else {
      throw Error('Please check bot-config.json file.');
    }

    return botConfig;
  } catch (error) {
    console.error('A error occurred while reading bot config file.');

    console.error((error as Error).message);

    // process.exit();

    throw Error((error as Error).message);
  }
};
