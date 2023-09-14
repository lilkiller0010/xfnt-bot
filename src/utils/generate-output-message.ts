import { Credential } from '../interface/credential';

export const generateOutputMessage = (
  crendential: Credential,
  url: string,
  ip: string,
): string => {
  const { email, last4ssn: ssn } = crendential;

  const message = `EMAIL=${email} SSN=${ssn} URL=${url} IP=${ip}`;

  return message;
};
