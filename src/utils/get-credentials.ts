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
        const [
          id,
          name,
          lastname,
          bid,
          address,
          city,
          state,
          zipCode,
          phoneNumber,
          phoneNumber2,
          email,
          ssn,
        ] = combo.trim().split(':');

        return {
          id,
          name,
          lastname,
          bid,
          address,
          city,
          state,
          zipCode,
          phoneNumber,
          phoneNumber2,
          email,
          ssn,
          last4ssn: ssn.slice(-4),
        };
      })
      .filter(
        (credential) =>
          credential?.name &&
          credential?.lastname &&
          credential?.ssn &&
          credential?.email &&
          credential?.last4ssn,
      );

    logger.debug('COMBO LIST FETCHED');

    return comboList;
  } catch (error) {
    logger.error(`COMBO LIST FILENAME INVALID! FILENAME=${comboListFileName}`);
    throw `Error while fetching combo list: ${error}`;
  }
};
