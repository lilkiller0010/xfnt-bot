import { createInterface } from 'readline';
import { runWebScraping } from './app';

import { getTime } from './utils';
import logger from './logger/logger';

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const readLineAsync = (msg: string): Promise<string> => {
  return new Promise<string>((resolve) => {
    readline.question(msg, (userRes) => {
      resolve(userRes);
    });
  });
};

const start = async () => {
  const comboListFileName = await readLineAsync(
    'Insert the COMBO_LIST FileName: ',
  );

  readline.close();

  runWebScraping(getTime(), comboListFileName);
};

start();
