import { Credential } from '../interface/credential';

export const generateOutputMessage = (
  crendential: Credential,
  url: string,
  ip: string,
): string => {
  const { email, password } = crendential;

  const message = `EMAIL=${email} PASSWORD=${password} IP=${ip}`;

  return message;
};
