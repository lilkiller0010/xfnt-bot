import { Credential } from '../interface/credential';
import logger from '../logger/logger';

export const generateOutputMessage = (
  crendential: Credential,
  url?: string,
): string => {
  const { email, last4ssn: ssn } = crendential;

  const message = `EMAIL=${email} SSN=${ssn} URL=${url}`;

  return message;
};
