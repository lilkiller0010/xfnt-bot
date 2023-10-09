import { Credential } from '../interface/credential';

export const generateOutputMessage = (
  crendential: Credential,
  url: string,
  userInformation?: string,
): string => {
  const { email, last4ssn } = crendential;

  const message = `EMAIL=${email} LAST4SSN=${last4ssn} ${userInformation || ''}`;

  return message;
};
