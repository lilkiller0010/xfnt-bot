import { createInterface } from 'readline';
import { runWebScraping } from './app';

import { getTime } from './utils';
import { vlk } from './utils/validate-license-key';

import { getBotConfig } from './utils/get-bot-config';

try {
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
    const botConfig = await getBotConfig();

    const { m: machineId, l: licenseKey } = await vlk(
      botConfig['license-key'],
    );

    console.log(`machineId: ${machineId}\n`);
    console.log(`licenseKey: ${licenseKey}\n`);

    setInterval(async () => {
      const licenseKey = await vlk(botConfig['license-key']);

      if (licenseKey.isExpired) {
        // process.exit();
      }
    }, 20000);

    const comboListFileName = await readLineAsync(
      'Insert the COMBO_LIST FileName: ',
    );

    readline.close();

    runWebScraping(getTime(), comboListFileName);
  };

  start();
} catch (error) {
  console.log('high catch', error);
}
