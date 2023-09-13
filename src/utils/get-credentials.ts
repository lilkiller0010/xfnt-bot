import fs from 'fs';
import { Credential } from '../interface/credential';
import logger from '../logger/logger';

export const getCredentials = async (comboListFileName: string) => {
  try {
    const readFileLines = async (filename: string) => {
      const file = await fs.promises.readFile(filename, { encoding: 'utf8' });

      return file.split(/\n/);
    };

    const _comboListFileName = `${comboListFileName}.txt`;

    const comboList: Credential[] = (await readFileLines(_comboListFileName))
      .map<Credential>((combo) => {
        const [_emailWithSnn, _ssn, _loanStatus] = combo.split('|');

        if (!_emailWithSnn || !_ssn || !_loanStatus) {
          return {
            email: '',
            lastSSN: '',
            ssn: '',
            previousLoanStatus: '',
          };
        }

        const [email, lastSSN] = _emailWithSnn
          .split(':')
          .map((str) => str.trim());

        const ssn = _ssn.split('=')[1].trim();

        const previousLoanStatus = _loanStatus.split('=')[1].trim();

        return {
          email,
          lastSSN,
          ssn,
          previousLoanStatus,
        };
      })
      .filter(
        (credential) =>
          credential?.email &&
          credential?.lastSSN &&
          credential?.ssn &&
          credential?.previousLoanStatus,
      );

    logger.debug('COMBO LIST FETCHED');

    return comboList;
  } catch (error) {
    logger.error(`COMBO LIST FILENAME INVALID! FILENAME=${comboListFileName}`);
    throw `Error while fetching combo list: ${error}`;
  }
};
